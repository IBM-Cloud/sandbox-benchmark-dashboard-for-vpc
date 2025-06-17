#!/bin/bash

set -x

## create ssh key for hadoop setup and install related packages.
su ubuntu -c '
cd /home/ubuntu/ && \
ssh-keygen -t rsa -P "" -f ~/.ssh/id_rsa && \
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys && \
chmod 0600 ~/.ssh/authorized_keys && \
sudo wget https://downloads.apache.org/hadoop/common/hadoop-3.2.4/hadoop-3.2.4.tar.gz && \
tar -xzf hadoop-3.2.4.tar.gz && \
sudo apt update -y && \
sudo apt install openjdk-8-jdk openssh-server openssh-client nmon ksh mysql-server -y
'

## setup mysql server for hive
su root -c '
apt-get update -y &&
apt install mysql-server -y &&
mysql -u root -p"test" <<EOF
CREATE DATABASE metastore;
CREATE USER "hiveuser"@"localhost" IDENTIFIED WITH mysql_native_password BY "password";
GRANT ALL PRIVILEGES ON metastore.* TO "hiveuser"@"localhost";
EOF
'

## setup ubuntu env variables
cat <<'EOF' >>/home/ubuntu/.bashrc
#Hadoop Related Options
export HADOOP_HOME=/home/ubuntu/hadoop-3.2.4
export HADOOP_INSTALL=$HADOOP_HOME
export HADOOP_MAPRED_HOME=$HADOOP_HOME
export HADOOP_COMMON_HOME=$HADOOP_HOME
export HADOOP_HDFS_HOME=$HADOOP_HOME
export YARN_HOME=$HADOOP_HOME
export HADOOP_COMMON_LIB_NATIVE_DIR=$HADOOP_HOME/lib/native
export PATH=$PATH:$HADOOP_HOME/sbin:$HADOOP_HOME/bin
export HADOOP_OPTS="-Djava.library.path=$HADOOP_HOME/lib/native"
EOF

cat <<'EOF' >>/home/ubuntu/hadoop-3.2.4/etc/hadoop/hadoop-env.sh
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
EOF

## install and configure apache hadoop
su ubuntu -c '
sed -i "/<configuration>/a<property><name>hadoop.tmp.dir</name>\n<value>/home/ubuntu/tmpdata</value>\n<description>A base for other temporary directories.</description>\n</property>\n<property>\n<name>fs.default.name</name>\n<value>hdfs://localhost:9000</value>\n<description>The name of the default file system></description>\n</property>" /home/ubuntu/hadoop-3.2.4/etc/hadoop/core-site.xml && \
sed -i "/<configuration>/a<property>\n\t<name>dfs.data.dir</name>\n\t<value>/home/ubuntu/dfsdata/namenode</value>\n</property>\n<property>\n\t<name>dfs.data.dir</name>\n\t<value>/home/ubuntu/dfsdata/datanode</value>\n</property>\n<property>\n\t<name>dfs.replication</name>\n\t<value>1</value>\n</property>" /home/ubuntu/hadoop-3.2.4/etc/hadoop/hdfs-site.xml && \
sed -i "/<configuration>/a<property>\n<name>mapreduce.framework.name</name>\n<value>yarn</value>\n</property>" /home/ubuntu/hadoop-3.2.4/etc/hadoop/mapred-site.xml && \
sed -i "/<configuration>/a<property>\n<name>yarn.nodemanager.aux-services</name>\n<value>mapreduce_shuffle</value>\n</property>\n<property>\n<name>yarn.nodemanager.aux-services.mapreduce.shuffle.class</name>\n<value>org.apache.hadoop.mapred.ShuffleHandler</value>\n</property>\n<property>\n<name>yarn.resourcemanager.hostname</name>\n<value>127.0.0.1</value>\n</property>\n<property>\n<name>yarn.acl.enable</name>\n<value>0</value>\n</property>\n<property>\n<name>yarn.nodemanager.env-whitelist</name>\n<value>JAVA_HOME,HADOOP_COMMON_HOME,HADOOP_HDFS_HOME,HADOOP_CONF_DIR,CLASSPATH_PERPEND_DISTCACHE,HADOOP_YARN_HOME,HADOOP_MAPRED_HOME</value>\n</property>" /home/ubuntu/hadoop-3.2.4/etc/hadoop/yarn-site.xml \
'
su ubuntu -c "export PATH=/home/ubuntu/hadoop-3.2.4/bin:\$PATH && hdfs namenode -format"
su ubuntu -c "cd /home/ubuntu/hadoop-3.2.4/sbin && ./start-all.sh"

## install and configure apache hive
su ubuntu -c '
cd /home/ubuntu && \
sudo wget https://archive.apache.org/dist/hive/hive-3.1.3/apache-hive-3.1.3-bin.tar.gz && \
tar xzf apache-hive-3.1.3-bin.tar.gz
'

cat <<'EOF' >>/home/ubuntu/.bashrc
export HIVE_HOME=/home/ubuntu/apache-hive-3.1.3-bin
export PATH=$PATH:$HIVE_HOME/bin
EOF

cat <<EOF >>/home/ubuntu/apache-hive-3.1.3-bin/bin/hive-config.sh
export HADOOP_HOME=/home/ubuntu/hadoop-3.2.4
EOF

su ubuntu -c "cd /home/ubuntu; export PATH=/home/ubuntu/:\$PATH; source ~/.bashrc"
su ubuntu -c "cd /home/ubuntu ;export PATH=/home/ubuntu/hadoop-3.2.4/bin:\$PATH; hdfs dfs -mkdir /tmp; hdfs dfs -chmod g+w /tmp;hdfs dfs -mkdir -p /user/hive/warehouse;hdfs dfs -chmod g+w /user/hive/warehouse"

su ubuntu -c '
rm -rf /home/ubuntu/apache-hive-3.1.3-bin/lib/guava-19.0.jar && \
cp /home/ubuntu/hadoop-3.2.4/share/hadoop/hdfs/lib/guava-27.0-jre.jar /home/ubuntu/apache-hive-3.1.3-bin/lib
'

## run hive server
su ubuntu -c "cd /home/ubuntu/apache-hive-3.1.3-bin/bin; ./hive & sleep 10"
su ubuntu -c '
cd /home/ubuntu/apache-hive-3.1.3-bin/lib
sudo wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.30/mysql-connector-java-8.0.30.jar
'

cat <<'EOF' >/home/ubuntu/apache-hive-3.1.3-bin/conf/hive-site.xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>

<property>
  <name>javax.jdo.option.ConnectionURL</name>
  <value>jdbc:mysql://localhost:3306/metastore?characterEncoding=UTF-8</value>
</property>


<property>
  <name>javax.jdo.option.ConnectionDriverName</name>
  <value>com.mysql.cj.jdbc.Driver</value>
</property>

<property>
  <name>javax.jdo.option.ConnectionUserName</name>
  <value>hiveuser</value>
</property>

<property>
  <name>javax.jdo.option.ConnectionPassword</name>
  <value>password</value>
</property>
<property>
<name>hive.metastore.schema.verification</name>
<value>false</value>
</property>
<property>
  <name>hive.server2.thrift.port</name>
  <value>10000</value>
</property>
<property>
  <name>hive.server2.thrift.bind.host</name>
  <value>host_ip_addr</value>
  <description>Note that this is the host name, not as misleading in some documents. It also needs to be followed by hadoop (but because some people’s hosts have has that name)</description>
</property>
<property>
  <name>hive.server2.authentication</name>
  <value>NONE</value>
  <description>
    Client authentication types.
      NONE: no authentication check
      LDAP: LDAP/AD based authentication
      KERBEROS: Kerberos/GSSAPI authentication
      CUSTOM: Custom authentication provider
              (Use with property hive.server2.custom.authentication.class)
  </description>
</property>

<property>
  <name>hive.server2.enable.doAs</name>
  <value>true</value>
</property>

<property>
    <name>datanucleus.schema.autoCreateAll</name>
    <value>false</value>
    <description>Automatically create metastore, but it seems to be of no use</description>
</property>
<property>
    <name>hive.server2.logging.operation.log.location</name>
    <value>/home/hadoop/java_tmp/${user.name}/operation_logs</value>
    <description>Operation log path</description>
</property>
<property>
  <name>hive.metastore.warehouse.dir</name>
  <value>/user/hive/warehouse</value>
</property>
<property>
<name>hive.exec.scratchdir</name>
<value>/tmp/hive</value>
</property>
<property>
<name>hive.querylog.location</name>
<!--<value>/home/ubuntu/data_hive/java_io_temp/${system:user.name}</value>-->
<value>/log</value>
    <description>2.8.0</description>
</property>
<property>
    <name>hive.metastore.uris</name>
    <value>thrift://host_ip_addr:9083</value>
    <description>Thrift URI for the remote metastore. Used by metastore client to connect to remote metastore.</description>
</property>
<property>
    <name>hive.server2.transport.mode</name>
    <value>binary</value>
    <description>
      When it is binary, only port 10000 is enabled, otherwise port 10001 is enabled.
    </description>
</property>
</configuration>
EOF

su ubuntu -c 'myaddr=$(hostname -i | awk "{print \$1}"); export myaddr; cd /home/ubuntu/apache-hive-3.1.3-bin/conf ; sed -i "s/host_ip_addr/$myaddr/g" hive-site.xml'
su ubuntu -c "cd /home/ubuntu/apache-hive-3.1.3-bin/conf; export PATH=/home/ubuntu/apache-hive-3.1.3-bin/bin:\$PATH;schematool -initSchema -dbType mysql"

su ubuntu -c '
cd /home/ubuntu/apache-hive-3.1.3-bin/lib && \
sudo wget -nc https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.30/mysql-connector-java-8.0.30.jar
mkdir -p /home/ubuntu/apache-hive-3.1.3-bin/hcatalog/var/log
'

## setup prestodb benchto project
su ubuntu -c "cd /home/ubuntu/apache-hive-3.1.3-bin/hcatalog/sbin; ./hcat_server.sh start"
su ubuntu -c '
cd /home/ubuntu; \
git clone https://github.com/prestodb/benchto.git && \
cd /home/ubuntu/benchto ; \
./mvnw clean install \
'

## setup presto-benchto benchmarks
su ubuntu -c '
cd /home/ubuntu; \
sudo wget https://github.com/prestodb/presto/archive/refs/tags/0.285.1.tar.gz; \
tar xzf 0.285.1.tar.gz; \
git clone https://github.com/prestodb/presto.git && \
cd /home/ubuntu; \
cp -r presto/.git presto-0.285.1 && \
cd /home/ubuntu/presto-0.285.1; \
./mvnw clean package -pl presto-benchto-benchmarks \
'

su ubuntu -c '
cd /home/ubuntu; \
sudo wget -O test-docker.sh https://test.docker.com; \
sh test-docker.sh; \
rm -rf test-docker.sh
'

## build and install benchto service
su ubuntu -c "cd /home/ubuntu/benchto/benchto-service/src/main/docker ; sed -i 's/java:8/openjdk:11/' Dockerfile"
su ubuntu -c "cd /home/ubuntu/benchto ; ./mvnw package -pl benchto-service -P docker-images;sudo apt install docker-compose -y;sudo kill '$(lsof -ti:8088)';sudo chmod 777 /var/run/docker* "

sed -i '/^\s*- \.\/config\/graphite\/carbon\.conf:\/opt\/graphite\/conf\/carbon\.conf$/a \ \ \ \ depends_on:\n\ \ \ \ \ \ \- benchto-postgres' /home/ubuntu/benchto/benchto-service-docker/docker-compose.yml
sed -i -e  "/SPRING_DATASOURCE_URL: 'jdbc:postgresql:\/\/benchto-postgres:5432\/postgres'/a \ \ \ \ depends_on:\n      - benchto-postgres" /home/ubuntu/benchto/benchto-service-docker/docker-compose.yml
sed -i "/SPRING_DATASOURCE_URL: 'jdbc:postgresql:\/\/benchto-postgres:5432\/postgres'/a \ \ \ \ \ \ PRESTO-BENCHTO: 'PRESTO-BENCHTO'" /home/ubuntu/benchto/benchto-service-docker/docker-compose.yml
sed -i '/command: bash \/tmp\/setup.sh/a \ \ \ \ depends_on:\n\ \ \ \ \ \ - benchto-graphite\n\ \ \ \ \ \ - benchto-postgres' /home/ubuntu/benchto/benchto-service-docker/docker-compose.yml

su ubuntu -c "cd /home/ubuntu/benchto/benchto-service-docker; sed -i -e 's/teradatalabs/willshen/' -e 's/graphite:0.9.14/graphite:1.0.2-2/' docker-compose.yml; sed -i -e 's/,1min:90d//' -e 's/,1min:30d//' /home/ubuntu/benchto/benchto-service-docker/config/graphite/storage-schemas.conf"
su ubuntu -c "cd /home/ubuntu/benchto/benchto-service-docker;sudo kill $(sudo lsof -ti:8088); docker-compose -f docker-compose.yml up -d"

sleep 30

## download and configure presto package
su ubuntu -c '
cd /home/ubuntu; \
sudo wget https://repo1.maven.org/maven2/com/facebook/presto/presto-server/0.285/presto-server-0.285.tar.gz && \
tar xf presto-server-0.285.tar.gz && \
cd /home/ubuntu/presto-server-0.285; \
mkdir /home/ubuntu/presto-server-0.285/etc
'
cat <<'EOF' >/home/ubuntu/presto-server-0.285/etc/node.properties
node.environment=production
node.id=ffffffff-ffff-ffff-ffff-ffffffffffff
node.data-dir=/var/presto/data
EOF

## update jvm.config for SPR and CLX 
lscpu | grep SapphireRapids
if [ $? -eq 0 ]; then
cat <<'EOF' >/home/ubuntu/presto-server-0.285/etc/jvm.config
-server
-Xmx64G 
-XX:+UseG1GC
-XX:G1HeapRegionSize=32M
-XX:+UseGCOverheadLimit
-XX:+ExplicitGCInvokesConcurrent
-XX:+HeapDumpOnOutOfMemoryError
-XX:+ExitOnOutOfMemoryError
-DHADOOP_USER_NAME=ubuntu
EOF

cat <<'EOF' >/home/ubuntu/presto-server-0.285/etc/config.properties
coordinator=true
node-scheduler.include-coordinator=true
http-server.http.port=8080
query.max-memory=64GB        
query.max-memory-per-node=25GB
discovery-server.enabled=true
discovery.uri=http://localhost:8080
memory.heap-headroom-per-node=5GB 
EOF
fi

lscpu | grep Cascadelake
if [ $? -eq 0 ]; then
cat <<'EOF' >/home/ubuntu/presto-server-0.285/etc/jvm.config
-server
-Xmx52G 
-XX:+UseG1GC
-XX:G1HeapRegionSize=32M
-XX:+UseGCOverheadLimit
-XX:+ExplicitGCInvokesConcurrent
-XX:+HeapDumpOnOutOfMemoryError
-XX:+ExitOnOutOfMemoryError
-DHADOOP_USER_NAME=ubuntu
EOF
cat <<'EOF' >/home/ubuntu/presto-server-0.285/etc/config.properties
coordinator=true
node-scheduler.include-coordinator=true
http-server.http.port=8080
query.max-memory=52GB        
query.max-memory-per-node=21GB
discovery-server.enabled=true
discovery.uri=http://localhost:8080
memory.heap-headroom-per-node=4GB 
EOF
fi

su ubuntu -c "cd /home/ubuntu/presto-server-0.285/etc; mkdir /home/ubuntu/presto-server-0.285/etc/catalog"

## update hive connector for presto
cat <<'EOF' >/home/ubuntu/presto-server-0.285/etc/catalog/hive.properties
connector.name=hive-hadoop2
hive.metastore.uri=thrift://localhost:9083
hive.parquet-batch-read-optimization-enabled=true
EOF

## update tpch benchmark connector for presto
cat <<'EOF' >/home/ubuntu/presto-server-0.285/etc/catalog/tpch.properties
connector.name=tpch
EOF
su root -c "sync ; echo 1 > /proc/sys/vm/drop_caches"

su ubuntu -c '
sudo apt install python-is-python3; \
cd /home/ubuntu/presto-server-0.285/bin ; \
sudo ./launcher start ; sleep 30
'

## download presto-cli and update tpch_10gb_text schemas for presto benchto benchmarks
su ubuntu -c "cd /home/ubuntu/presto-server-0.285/bin ; sudo wget https://repo1.maven.org/maven2/com/facebook/presto/presto-cli/0.283/presto-cli-0.283-executable.jar;mv presto-cli-0.283-executable.jar presto;sudo chmod +x presto"

su ubuntu -c "cd /home/ubuntu/presto-0.285.1/presto-benchto-benchmarks/generate_schemas"
sed -i -e '/tpch_10gb_orc.*tpch\.sf10/,/tpch_1tb_text.*hive\.tpch_1tb_orc/d' -e "s/('tpch_10tb_text', 'hive.tpch_10tb_orc'),/('tpch_10gb_parquet', 'tpch.sf10'),/" -e 's/table)/table))/' -e 's/_orc/_parquet/' -e 's/ORC/PARQUET/' -e "s/'CREATE/('CREATE/g" -e "s/(new_schema,)/(new_schema,))/g" /home/ubuntu/presto-0.285.1/presto-benchto-benchmarks/generate_schemas/generate-tpch.py

su ubuntu -c "cd /home/ubuntu/apache-hive-3.1.3-bin/hcatalog/sbin; \
export HADOOP_HOME=/home/ubuntu/hadoop-3.2.4; \
export HIVE_CONF_DIR=/home/ubuntu/apache-hive-3.1.3-bin/conf/hive-site.xml; \
export HIVE_HOME=/home/ubuntu/apache-hive-3.1.3-bin; \
export PATH=$PATH:$HIVE_HOME/bin; \
./hcat_server.sh start"

sleep 10

## generate tpch schema
su ubuntu -c '
cd /home/ubuntu/presto-0.285.1/presto-benchto-benchmarks/generate_schemas; \
python3 generate-tpch.py | \
/home/ubuntu/presto-server-0.285/bin/presto --server localhost:8080 --catalog hive --schema default; \
cd /home/ubuntu/presto-0.285.1; \
sudo wget https://repo1.maven.org/maven2/com/facebook/presto/presto-jdbc/0.285/presto-jdbc-0.285.jar
'

cat <<'EOF' >/home/ubuntu/presto-0.285.1/application-presto-benchto.yaml
---
benchmark-service:
  url: http://host_ip_addr:80
data-sources:
  presto:
    url: jdbc:presto://host_name:8080/hive?user=ubuntu
    driver-class-name: com.facebook.presto.jdbc.PrestoDriver
environment:
  name: PRESTO-BENCHTO
presto:
  url: http://host_ip_addr:8080
benchmark:
  feature:
    presto:
      metrics.collection.enabled: true
macros:
  sleep-4s:
    command: echo “Sleeping for 4s” && sleep 4
EOF

cat <<'EEOF' >/home/ubuntu/presto-0.285.1/set_env.sh
sudo curl -H 'Content-Type: application/json' -d '{
  "dashboardType": "grafana",
  "dashboardURL": "http://admin:admin@host_ip_addr:3000/dashboard/db/presto-benchto",
  "prestoURL": "http://host_ip_addr:8080"
}' http://host_ip_addr:80/v1/environment/PRESTO-BENCHTO

sudo curl -H 'Content-Type: application/json' -d '{
  "name": "Short tag desciption",
  "description": "Very long but optional tag description"
}' http://host_ip_addr:80/v1/tag/PRESTO-BENCHTO
EEOF

sed -i '/^import okhttp3\.Protocol;/a\
import com.facebook.presto.jdbc.internal.guava.net.HostAndPort;\
import com.facebook.presto.jdbc.internal.okhttp3.OkHttpClient;\
import com.facebook.presto.jdbc.internal.guava.base.Splitter;\
import com.facebook.presto.jdbc.internal.guava.collect.*;\
import com.facebook.presto.jdbc.internal.client.*;\
import com.facebook.presto.jdbc.internal.okhttp3.OkHttpClient;\
import com.facebook.presto.jdbc.internal.okhttp3.Protocol;' /home/ubuntu/presto-0.285.1/presto-jdbc/src/main/java/com/facebook/presto/jdbc/PrestoDriverUri.java

sed -i -e 's/^import com\.facebook\.presto\.client\.ClientException;/\/\* &/' -e 's/^import okhttp3\.Protocol;/& \*\//' /home/ubuntu/presto-0.285.1/presto-jdbc/src/main/java/com/facebook/presto/jdbc/PrestoDriverUri.java
sed -i -e 's/^import static com\.facebook\.presto\.client\.GCSOAuthInterceptor\.GCS_CREDENTIALS_PATH_KEY;/\/\* &/' -e 's/^import static com\.facebook\.presto\.client\.OkHttpUtil\.tokenAuth;/& \*\//' -e 's/^import static com\.facebook\.presto\.jdbc\.internal\.guava\.base\.Strings\.isNullOrEmpty;/\/\* & \*\//' /home/ubuntu/presto-0.285.1/presto-jdbc/src/main/java/com/facebook/presto/jdbc/PrestoDriverUri.java
sed -i -e 's/^import static com\.facebook\.presto\.jdbc\.internal\.guava\.base\.Strings\.isNullOrEmpty;/\/\* &/' -e  's/^import static com\.facebook\.presto\.jdbc\.internal\.guava\.base\.Strings\.isNullOrEmpty;/& \*\//' /home/ubuntu/presto-0.285.1/presto-jdbc/src/main/java/com/facebook/presto/jdbc/PrestoDriverUri.java
sed -i  '/import static com.google.common.base.Strings.isNullOrEmpty;/d'  /home/ubuntu/presto-0.285.1/presto-jdbc/src/main/java/com/facebook/presto/jdbc/PrestoDriverUri.java

sed -i  '/^import static java\.util\.Objects\.requireNonNull;/a\
import static com\.facebook\.presto\.jdbc\.internal\.client\.GCSOAuthInterceptor\.GCS_CREDENTIALS_PATH_KEY;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.GCSOAuthInterceptor\.GCS_OAUTH_SCOPES_KEY;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.KerberosUtil\.defaultCredentialCachePath;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.OkHttpUtil\.basicAuth;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.OkHttpUtil\.setupCookieJar;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.OkHttpUtil\.setupHttpProxy;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.OkHttpUtil\.setupKerberos;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.OkHttpUtil\.setupSocksProxy;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.OkHttpUtil\.setupSsl;\
import static com\.facebook\.presto\.jdbc\.internal\.client\.OkHttpUtil\.tokenAuth;\
import static com\.facebook\.presto\.jdbc\.internal\.guava\.base\.Strings\.isNullOrEmpty;' /home/ubuntu/presto-0.285.1/presto-jdbc/src/main/java/com/facebook/presto/jdbc/PrestoDriverUri.java

su ubuntu -c '
myaddr=$(hostname -I | awk "{print \$1}"); export myaddr; \
cd /home/ubuntu/presto-0.285.1 ; \
sed -i "s/host_ip_addr/$myaddr/g" application-presto-benchto.yaml; \
sed -i "s/host_ip_addr/$myaddr/g" set_env.sh; \
hname=$(hostname); export hname; \
sed -i "s/host_name/$hname/g" application-presto-benchto.yaml; \
sed -i "s/host_ip_addr/$myaddr/g" application-presto-benchto.yaml; \
sed -i "s/host_name/$hname/" application-presto-benchto.yaml; \
javac -cp presto-jdbc-0.285.jar -d presto-jdbc presto-jdbc/src/main/java/com/facebook/presto/jdbc/PrestoDriverUri.java; \
chmod +x application-presto-benchto.yaml; \
chmod +x set_env.sh
'

sed -i -e 's/\(ELIMINATE_CROSS_JOINS\|PARTITIONED\),\?//g' -e 's/\${tpch_[0-9]\+}/\${tpch_10}/g' -e '/tpch_300: tpch_sf300_orc/d; /tpch_1000: tpch_sf1000_orc/d'  -e 's/tpch_3000: tpch_sf3000_orc/tpch_10: tpch_10gb_parquet/' -e "s/runs: 6/runs: 3/" /home/ubuntu/presto-0.285.1/presto-benchto-benchmarks/src/main/resources/benchmarks/presto/tpch.yaml
sed -i -e '/^  2:/,$d' -e 's/q05, q07, q08, q09, q17, q18, q21/query/' /home/ubuntu/presto-0.285.1/presto-benchto-benchmarks/src/main/resources/benchmarks/presto/tpch.yaml

cat <<'EOF' >/home/ubuntu/presto-0.285.1/overrides.yaml
runs: 3
tpch_medium: tpch_10gb_parquet
EOF

## this is a presto runner script to run the benchmark
cat <<'EOF' > /home/ubuntu/presto_runner_metrics.sh
#!/bin/bash



# Your script commands with output redirection
# Remove existing log files
script_dir=$(cd "$(dirname "$0")" && pwd)
LOG_FILE="$script_dir/presto.log"
rm -f $script_dir/presto.log
{
rm -f $script_dir/presto.nmon $script_dir/output.log


userInput=$1


## presto default query
defaultInput="q21"


# Define the allowed values
allowed_inputs='q01,q02,q03,q04,q05,q06,q07,q08,q09,q10,q11,q12,q13,q14,q15,q16,q17,q18,q19,q20,q21,q22,default,ALL'


# Check if the argument is provided
if [ -z "$userInput" ]; then
  echo "Error: Argument is missing."
  echo "Status: FAILED" > $script_dir/output.log
  exit 1
fi


# Check if the argument is in the list of allowed values
if echo "$allowed_inputs" | grep -q -w "$userInput"; then
  echo "Argument '$userInput' is valid."
else
  echo "Error: Argument '$userInput' is not valid."
  echo "Status: FAILED" > $script_dir/output.log
  exit 1
fi


## presto benchmark queries
values='q01,q02,q03,q04,q05,q06,q07,q08,q09,q10,q11,q12,q13,q14,q15,q16,q17,q18,q19,q20,q21,q22'


# Check if input is "ALL" or "default"
if [[ "$userInput" == "ALL" ]]; then
    selectedValues=$values
elif [[ "$userInput" == "default" ]]; then
    selectedValues=$defaultInput
else
    selectedValues=$userInput
fi


sed -i "s/query:.*/query: $selectedValues/" /home/ubuntu/presto-0.285.1/presto-benchto-benchmarks/src/main/resources/benchmarks/presto/tpch.yaml


## execute nmon service
nmon -f -s 30 -c 20 -F $script_dir/presto.nmon 2>&1


## stop presto benchmark setup
docker-compose -f /home/ubuntu/benchto/benchto-service-docker/docker-compose.yml down


## To ensure that all services are properly shut down before restarting, a brief sleep period has been incorporated,
## allowing adequate time for services that require 3-4 seconds to gracefully conclude their operations.
sleep 5


## start presto benchmark setup
docker-compose -f /home/ubuntu/benchto/benchto-service-docker/docker-compose.yml up -d


## To guarantee the full operation of all services, a delay has been introduced,
## allowing for sufficient time for services that require up to 15 seconds to initialize and become fully functional.
sleep 20


## start presto benchto service
docker start benchto-service-docker_benchto-service_1


## Added a delay to ensure that the Benchto service is fully operational before initiating the Presto benchmark.
sleep 10


## start the presto benchto benchmark
sh /home/ubuntu/presto-0.285.1/set_env.sh
cd /home/ubuntu/presto-0.285.1
java -Xmx1g -jar presto-benchto-benchmarks/target/presto-benchto-benchmarks-*-executable.jar --sql presto-benchto-benchmarks/src/main/resources/sql --benchmarks presto-benchto-benchmarks/src/main/resources/benchmarks --activeBenchmarks=presto/tpch --profile=presto-benchto  --overrides overrides.yaml


## added a delay to ensure that the benchmark results are accurately updated in the database.
sleep 15


## Kill the nmon service
pkill nmon


## gather presto benchmark data and utilization metrics
ExecutionTime=`docker ps | grep postgres | awk '{print $1}' | xargs -I {} docker exec {} bash -c 'psql -U postgres -At -c "SELECT AVG(value) FROM measurements WHERE id IN (11, 18) AND name = '\''duration'\'';"'`
Memtotal=`cat $script_dir/presto.nmon| grep -e MemTotal | awk '{ print $2}'`
MemFree=`cat $script_dir/presto.nmon | grep -e MemFree | awk '{ print $2}'`
MemUtil=$((($Memtotal-$MemFree)*100/$Memtotal))
CpuUtil=`cat $script_dir/presto.nmon| grep CPU_ALL | grep T0001 | cut -d ',' -f3`
VSI=$(hostname)


## added a delay to ensure that the benchmark result status is accurately updated in the database.
sleep 2


## check the execution status of the query
ExecutionStatus=`docker ps | grep postgres | awk '{print $1}' | xargs -I {} docker exec {} bash -c 'psql -U postgres -At -c "select Status  from benchmark_runs;"' | grep -i "FAILED"`
if [[ -z "$ExecutionStatus" ]]; then
    ExecutionStatus="PASSED"
else
    ExecutionStatus="FAILED"
fi


## update the output of presto benchmark in output.log
echo "VSI Type: $VSI" > $script_dir/output.log
echo "Status: $ExecutionStatus" >> $script_dir/output.log
echo "Memory Utlization: $MemUtil%" >> $script_dir/output.log
echo "CPU Utlization: $CpuUtil%" >> $script_dir/output.log
echo "Query $userInput ExecutionTime(ms): $ExecutionTime" >> $script_dir/output.log
} > "$LOG_FILE" 2>&1

EOF

sudo chmod 777 /home/ubuntu/presto_runner_metrics.sh