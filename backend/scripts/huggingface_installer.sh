#!/bin/bash
sudo apt-get update -y

# Installing nmon and ksh to get the performance metrics via nmon while running the application.
sudo apt install nmon ksh -y


# Add libtcmalloc for extra performance
sudo DEBIAN_FRONTEND=noninteractive apt install libgoogle-perftools-dev -y
export LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libtcmalloc.so"

sudo DEBIAN_FRONTEND=noninteractive apt-get install python3-pip -y
pip install pip --upgrade
export PATH=/home/ubuntu/.local/bin:$PATH
pip install virtualenv
virtualenv /home/ubuntu/inference_env
. /home/ubuntu/inference_env/bin/activate

# Installing Pytorch and transformers
pip3 install torch -f https://download.pytorch.org/whl/cpu
pip3 install intel_extension_for_pytorch -f https://developer.intel.com/ipex-whl-stable-cpu
pip3 install transformers

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
fi

lscpu | grep SapphireRapids
if [ $? -eq 0 ]; then

# Installing Intel Optimum library
pip3 install optimum[intel]

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
