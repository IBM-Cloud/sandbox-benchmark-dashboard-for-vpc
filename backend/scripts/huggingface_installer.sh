#!/bin/bash
sudo apt-get update -y

sudo apt-get install python3.10-venv -y

# Installing nmon and ksh to get the performance metrics via nmon while running the application.
sudo apt install nmon ksh -y


# Add libtcmalloc for extra performance
sudo DEBIAN_FRONTEND=noninteractive apt install libgoogle-perftools-dev -y
export LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libtcmalloc.so"

sudo DEBIAN_FRONTEND=noninteractive apt-get install python3-pip -y
pip install --upgrade pip
export PATH=/home/ubuntu/.local/bin:$PATH
python3 -m venv /home/ubuntu/inference_env
. /home/ubuntu/inference_env/bin/activate

pip install setuptools==69.5.0 wheel

# Installing Pytorch and transformers
pip install torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu
pip install intel_extension_for_pytorch==2.3.0 -f https://developer.intel.com/ipex-whl-stable-cpu

# Creating & locking requirements.txt for pip3 versions
cat <<'EOF' > requirements.txt
certifi==2024.7.4
charset-normalizer==3.3.2
huggingface-hub==0.24.5
idna==3.7
PyYAML==6.0.2
regex==2024.7.24
requests==2.32.3
safetensors==0.4.4
tokenizers==0.19.1
tqdm==4.66.5
transformers==4.44.0
urllib3==2.2.2
EOF
pip3 install -r requirements.txt

lscpu | grep Cascadelake
if [ $? -eq 0 ]; then

# This script benchmarks the Bert-based and Roberta-based inference models on a text classification task.
# It is based on popular Huggingface transformers implemented with PYTorch
cat <<'EOF' >/home/ubuntu/hf_benchmark.py
import time

import numpy as np
import torch
from transformers import pipeline


def benchmark(pipeline, data, iterations=100):
    # After a few warmup iterations, we run 100 predictions with pipeline API
    for i in range(10):
        result = pipeline(data)
    times = []
    for i in range(iterations):
        tick = time.time()
        result = pipeline(data)
        tock = time.time()
        times.append(tock - tick)
    return "{:.2f}".format(np.mean(times) * 100)


sentence_short = "This is a really nice pair of shoes, I am completely satisfied with my purchase"
sentence_short_array = [sentence_short] * 8

models = ["bert-base-uncased", "roberta-base"]

for model in models:
    print(f"Benchmarking {model}")
    pipe = pipeline("sentiment-analysis", model=model)
    result = benchmark(pipe, sentence_short)
    print(f"{model} Transformers pipeline short_sentence {result}")
    result = benchmark(pipe, sentence_short_array)
    print(f"{model} Transformers pipeline short_sentence_array {result}")

EOF
chmod 644 /home/ubuntu/hf_benchmark.py
fi

lscpu | grep SapphireRapids
if [ $? -eq 0 ]; then

# Creating & locking requirements.txt for pip3 versions(Intel Optimum library)
cat <<'EOF' > requirements.txt
aiohappyeyeballs==2.3.5
aiohttp==3.10.3
aiosignal==1.3.1
async-timeout==4.0.3
attrs==24.2.0
coloredlogs==15.0.1
datasets==2.20.0
dill==0.3.8
frozenlist==1.4.1
fsspec==2024.5.0
humanfriendly==10.0
multidict==6.0.5
multiprocess==0.70.16
numpy==1.26.4
onnx==1.16.2
optimum==1.21.3
optimum-intel==1.18.2
pandas==2.2.2
protobuf==5.27.3
pyarrow==17.0.0
pyarrow-hotfix==0.6
python-dateutil==2.9.0.post0
pytz==2024.1
scipy==1.14.0
sentencepiece==0.2.0
six==1.16.0
transformers==4.43.4
tzdata==2024.1
xxhash==3.4.1
yarl==1.9.4
EOF
pip3 install -r requirements.txt

# This script benchmarks the Bert-based and Roberta-based inference models on a text classification task.
# It is based on popular Huggingface transformers implemented with PYTorch
cat <<'EOF' >/home/ubuntu/hf_benchmark.py
import time

import numpy as np
import torch
from transformers import pipeline


def benchmark(pipeline, data, iterations=100):
    # After a few warmup iterations, we run 100 predictions with pipeline API
    for i in range(10):
        result = pipeline(data)
    times = []
    for i in range(iterations):
        tick = time.time()
        result = pipeline(data)
        tock = time.time()
        times.append(tock - tick)
    return "{:.2f}".format(np.mean(times) * 100)

sentence_short = "This is a really nice pair of shoes, I am completely satisfied with my purchase"
sentence_short_array = [sentence_short] * 8

models = ["bert-base-uncased", "roberta-base"]

for model in models:
    print(f"Benchmarking {model}")
    pipe = pipeline("sentiment-analysis", model=model)

    from optimum.intel import inference_mode

    with inference_mode(pipe, dtype=torch.bfloat16, jit=True) as opt_pipe:
        result = benchmark(opt_pipe, sentence_short)
        print(f"{model} Optimum pipeline short_sentence {result}")
        result = benchmark(opt_pipe, sentence_short_array)
        print(f"{model} Optimum pipeline short_sentence_array {result}")

EOF
chmod 644 /home/ubuntu/hf_benchmark.py
fi

# Generate huggingface runner script
# This script will execute the benchmark based on the Bert-based and Roberta-based inference models on a text classification task.
# It is based on popular Huggingface transformers implemented with PYTorch.
# it will be invoked when user run the huggingface benchmark from sandbox dashboard.
cat <<'EOF' >/home/ubuntu/huggingface_runner.sh
#!/bin/bash
rm -rf huggingface.nmon
rm -rf output.log
rm -rf benchmark.log

nmon -f -s 10 -c 12 -F huggingface.nmon 2>&1
sleep 2

. /home/ubuntu/inference_env/bin/activate
python /home/ubuntu/hf_benchmark.py > benchmark.log

pkill nmon

Memtotal=`cat huggingface.nmon| grep -e MemTotal | awk '{ print $2}'`
MemFree=`cat huggingface.nmon | grep -e MemFree | awk '{ print $2}'`
MemUtil=$((($Memtotal-$MemFree)*100/$Memtotal))
CpuUtil=`cat huggingface.nmon| grep CPU_ALL | grep T0002 | cut -d ',' -f3`
VSI=$(hostname)

cat benchmark.log| grep short | awk '{print $1 "_" $4 " " $5 "ms"}' >>output.log
echo "VSI Type: $VSI" >>output.log
echo "Memory Utlization: $MemUtil%" >> output.log
echo "CPU Utlization: $CpuUtil%" >> output.log

EOF

chmod +x /home/ubuntu/huggingface_runner.sh
