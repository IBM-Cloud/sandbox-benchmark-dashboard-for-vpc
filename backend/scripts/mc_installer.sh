#!/bin/bash

sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Installing nmon and ksh to get the performance metrics via nmon while running the application.
sudo apt install nmon ksh -y
 
# Install intel libraries
sudo DEBIAN_FRONTEND=noninteractive apt-get -yq install intel-mkl g++ libtbb-dev libomp-13-dev
sudo ln -s /usr/lib/x86_64-linux-gnu/libmkl_intel_ilp64.so /usr/lib/x86_64-linux-gnu/libmkl_intel_ilp64.so.2
sudo ln -s /usr/lib/x86_64-linux-gnu/libmkl_sequential.so /usr/lib/x86_64-linux-gnu/libmkl_sequential.so.2
sudo ln -s /usr/lib/x86_64-linux-gnu/libmkl_core.so /usr/lib/x86_64-linux-gnu/libmkl_core.so.2
 
#Build MonteCarlo binary
git clone https://github.com/intel/Financial-Services-Workload-Samples.git
 
pushd Financial-Services-Workload-Samples/MonteCarloEuropeanOptions
sed -i '15i#include <math.h>' MonteCarloInsideBlockingDP.cpp
 
export CPATH=/usr/include/mkl/
g++ MonteCarloInsideBlockingDP.cpp -ltbbmalloc -Bstatic  -Wl,--start-group -lmkl_intel_ilp64 -lmkl_sequential -lmkl_core -Wl,--end-group -g -O3 -fopenmp -DMKL_ILP64 -o MonteCarlo
sudo mv MonteCarlo /home/ubuntu
 
popd
 
# Generate montecarlo runner script
# This script will execute the Montecarlo benchmark which is a Financial  Workload.
# it will be invoked when user run the montecarlo benchmark from sandbox dashboard.
cat <<'EOF' >/home/ubuntu/montecarlo_runner.sh
#!/bin/bash


basedir=/home/ubuntu
testdir=$basedir/montecarlo-results
montecarlo=$basedir/MonteCarlo
 
# create some directories
mkdir -p $testdir
pushd $testdir


# Remove existing log files
rm -f montecarlo.log
rm -f montecarlo.nmon output.log


# Execute nmon service
nmon -f -s 30 -c 20 -F montecarlo.nmon 2>&1
> montecarlo.log


# Execute monte carlo application
$montecarlo 8 20000 64K 4K 2>&1 |tee -a montecarlo.log
sleep 2
 
# Kill the nmon service
pkill nmon

Memtotal=`cat montecarlo.nmon| grep -e MemTotal | awk '{ print $2}'`
MemFree=`cat montecarlo.nmon | grep -e MemFree | awk '{ print $2}'`
MemUtil=$((($Memtotal-$MemFree)*100/$Memtotal))
CpuUtil=`cat montecarlo.nmon| grep CPU_ALL | grep T0001 | cut -d ',' -f3`
OPS=`cat montecarlo.log | grep Opt/sec | awk '{print $3}'`
VSI=$(hostname)
echo "VSI Type: $VSI" > output.log
echo "Memory Utlization: $MemUtil%" >> output.log
echo "CPU Utlization: $CpuUtil%" >> output.log
echo "Operations Sec: $OPS" >> output.log

popd

EOF
 
sudo chmod +x /home/ubuntu/montecarlo_runner.sh
sudo chmod +x /home/ubuntu/MonteCarlo