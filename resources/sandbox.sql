-- Create database
CREATE DATABASE ibm_sandbox;
-- Connect to the database
\c ibm_sandbox;
-- Table: vsi_info
CREATE TABLE vsi_info (
    id VARCHAR(255) PRIMARY KEY,
    vsi_name VARCHAR(255),
    vsi_profile VARCHAR(255),
    ip_address VARCHAR(255),
    vsi_status VARCHAR(255),
    createtime VARCHAR(255),
    delete_bit VARCHAR(1),
    keypair_id VARCHAR(255),
    keypair_name VARCHAR(255),
    app_name VARCHAR(255)
);
-- Table: montecarlo
CREATE TABLE montecarlo (
    id SERIAL PRIMARY KEY,
    vsi_name VARCHAR(255),
    vsi_profile VARCHAR(255),
    performance_metric_1 VARCHAR(255),
    cpu_utilization VARCHAR(255),
    memory_utilization VARCHAR(255),
    createtime VARCHAR(255),
    attachments VARCHAR(255),
    instance_id VARCHAR(255),
    delete_bit VARCHAR(1)
);
-- Table: huggingface
CREATE TABLE huggingface (
    id SERIAL PRIMARY KEY,
    vsi_name VARCHAR(255),
    vsi_profile VARCHAR(255),
    bert_short_sentence VARCHAR(255),
    bert_short_sentence_array VARCHAR(255),
    roberta_short_sentence VARCHAR(255),
    roberta_short_sentence_array VARCHAR(255),
    cpu_utilization VARCHAR(255),
    memory_utilization VARCHAR(255),
    createtime VARCHAR(255),
    instance_id VARCHAR(255),
    delete_bit VARCHAR(1),
    attachments VARCHAR(255)
);

-- Table: byo
CREATE TABLE byo (
    id SERIAL PRIMARY KEY,
    vsi_name VARCHAR(255),
    vsi_profile VARCHAR(255),
    max_cpu_utilization FLOAT,
    current_cpu_utilization FLOAT,
    sum_cpu_utilization FLOAT,
    count_cpu INT,
    max_memory_utilization FLOAT,
    current_memory_utilization FLOAT,
    sum_memory_utilization FLOAT,
    count_memory INT,
    max_network_rx_utilization FLOAT,
    current_network_rx_utilization FLOAT,
    sum_network_rx_utilization FLOAT,
    count_network_rx INT,
    max_network_tx_utilization FLOAT,
    current_network_tx_utilization FLOAT,
    sum_network_tx_utilization FLOAT,
    count_network_tx INT,
    max_io_utilization FLOAT,
    current_io_utilization FLOAT,
    sum_io_utilization FLOAT,
    count_io INT,
    createtime VARCHAR(255),
    instance_id VARCHAR(255),
    delete_bit VARCHAR(1)
);

-- Table: presto
CREATE TABLE presto (
    id SERIAL PRIMARY KEY,
    vsi_name VARCHAR(255),
    vsi_profile VARCHAR(255),
    query_execution_time VARCHAR(255),
    cpu_utilization VARCHAR(255),
    memory_utilization VARCHAR(255),
    createtime VARCHAR(255),
    attachments VARCHAR(255),
    instance_id VARCHAR(255),
    delete_bit VARCHAR(1)
);

-- Table: benchmark_status
CREATE TABLE benchmark_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    vsi_name VARCHAR(255),
    benchmark VARCHAR(255),
    category VARCHAR(255),
    run_status VARCHAR(255),
    start_date VARCHAR(255),
    attachments VARCHAR(255)
);
CREATE TABLE users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255)
);

CREATE TABLE flags (
    api_name VARCHAR(255) PRIMARY KEY,
    flag BOOLEAN
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (username, password) VALUES ('admin', crypt('ENCODE_PASSWORD', gen_salt('bf')));

INSERT INTO flags (api_name, flag) VALUES 
  ('create_instance_montecarlo', false),
  ('create_instance_huggingface', false),
  ('create_instance_byo', false),
  ('create_instance_presto', false),
  ('delete_instance_montecarlo', false),
  ('delete_instance_huggingface', false),
  ('delete_instance_byo', false),
  ('delete_instance_presto', false),
  ('run_benchmark_montecarlo', false),
  ('run_benchmark_huggingface', false),
  ('run_benchmark_byo', false),
  ('run_byo_polling', false),
  ('run_benchmark_presto', false);