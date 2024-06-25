#!/bin/bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y

# Installing sysstat to gather performance data and statistics
sudo DEBIAN_FRONTEND=noninteractive apt install sysstat -y

# This script will be invoked in every 10 seconds to get the utilization metrics for byo VSIs.
# It will be invoked by /byopolling API from sandbox dashboard
cat <<'EOF' >/home/ubuntu/byo_runner.sh
#!/bin/bash

rm -f output.log

MemUtil=`free | awk '/Mem/{printf("%.2f\n"), $3/$2*100}'`
CpuUtil=`top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\([0-9.]*\)%* id.*/\1/' | awk '{print 100 - $1}'`
IOUtil=`iostat -x | awk '$1 == "vda" {print $NF}'`
NetUtil_RX=`sar -n DEV 1 1 | grep -E 'Average.*[0-9]' | grep -e ens3 -e eth0 | awk '{rx = $2 + $6; tx = $4 + $8; if (rx + tx  > 0) printf("%.2f", (rx / (rx + tx)) * 100); else printf("%.2f", 0.00)}'`
NetUtil_TX=`sar -n DEV 1 1 | grep -E 'Average.*[0-9]' | grep -e ens3 -e eth0 | awk '{rx = $2 + $6; tx = $4 + $8; if (rx + tx  > 0) printf("%.2f", (tx / (rx + tx)) * 100); else printf("%.2f", 0.00)}'`

echo "Memory Utilization: $MemUtil" >>output.log
echo "CPU Utilization: $CpuUtil" >>output.log
echo "IO Utilization: $IOUtil" >>output.log
echo "Network_Rx Utilization: $NetUtil_RX" >>output.log
echo "Network_Tx Utilization: $NetUtil_TX" >>output.log

EOF
 
sudo chmod +x /home/ubuntu/byo_runner.sh
