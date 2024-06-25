import apiRequest from "./apiRequest";
const API_URL = process.env.REACT_APP_API_URL;

function getHeader() {
    const token = localStorage.getItem("token");
    const headers = { Authorization: token };
    return headers;
}

export async function getMetadata() {
    return await apiRequest('get', `${API_URL}sandbox/getmetadata`, null, getHeader());
}
export async function LoginApi(data) {
    return await apiRequest('post', `${API_URL}sandbox/login`, data, getHeader());
}
/* Monte Carlo Api's */

export async function getMonteCarlo() {
    return await apiRequest('get', `${API_URL}sandbox/get-montecarlo-instances`, null, getHeader());
}

export async function createMonteCarloInstances(data) {
    return await apiRequest('post', `${API_URL}sandbox/create-montecarlo-instances`, data, getHeader());
}

export async function monteCarloRunBenchmark(data) {
    return await apiRequest('post', `${API_URL}sandbox/run-montecarlo-benchmark`, data, getHeader());
}

export async function getMonteCarloRunLists(body) {
    return await apiRequest('get', `${API_URL}sandbox/list-montecarlo-benchmark?page=${body.page}&count=${body.count}`, null, getHeader());
}

export async function deleteMonteCarloInstances(data) {
    return await apiRequest('delete', `${API_URL}sandbox/delete-montecarlo-instances`, data, getHeader());
}

export async function resetBenchmark(data) {
    return await apiRequest('post', `${API_URL}sandbox/reset-benchmark`, data, getHeader());
}

/* HuggingFace Api's */

export async function getHuggingFace() {
    return await apiRequest('get', `${API_URL}sandbox/get-huggingface-instances`, null, getHeader());
}

export async function createHuggingInstances(data) {
    return await apiRequest('post', `${API_URL}sandbox/create-huggingface-instances`, data, getHeader());
}

export async function huggingRunBenchmark(data) {
    return await apiRequest('post', `${API_URL}sandbox/run-huggingface-benchmark`, data, getHeader());
}

export async function getHuggingRunLists(body) {
    return await apiRequest('get', `${API_URL}sandbox/list-huggingface-benchmark?page=${body.page}&count=${body.count}`, null, getHeader());
}

export async function deleteHuggingInstances(data) {
    return await apiRequest('delete', `${API_URL}sandbox/delete-huggingface-instances`, data, getHeader());
}

/* BYO Api's */

export async function getByo() {
    return await apiRequest('get', `${API_URL}sandbox/get-byo-instances`, null, getHeader());
}

export async function createByoInstances(data) {
    return await apiRequest('post', `${API_URL}sandbox/create-byo-instances`, data, getHeader());
}

export async function deleteByoInstances(data) {
    return await apiRequest('delete', `${API_URL}sandbox/delete-byo-instances`, data, getHeader());
}

export async function getByoPolling() {
    return await apiRequest('get', `${API_URL}sandbox/byopolling`, null, getHeader());
}

/* Configuration Page Api */

export async function getAllInstances() {
    return await apiRequest('post', `${API_URL}sandbox/get-all-instances`, null, getHeader());
}

/* Performance Dashboard Api */

/* Byo */

export async function getByoLists(body) {
    return await apiRequest('get', `${API_URL}sandbox/list-byo-benchmark?page=${body.page}&count=${body.count}`, null, getHeader());
}

export async function runByoApi(data) {
    return await apiRequest('post', `${API_URL}sandbox/run-byo-benchmark`, data, getHeader());
}


/* Benchmark Run Logs Api */

export async function getInstanceStatus() {
    return await apiRequest('get', `${API_URL}sandbox/statusupdate`, null, getHeader());
}

export async function getBenchmarkRunLogs(data) {
    return await apiRequest('post', `${API_URL}sandbox/listlogs`, data, getHeader());
}

export async function downloadLogsApi(logs) {
    return await apiRequest('get', `${API_URL}sandbox/download-logs?filepath=${logs}`, null, getHeader());
}

/* Presto App Api */

export async function getPrestoInstances() {
    return await apiRequest('get', `${API_URL}sandbox/get-presto-instances`, null, getHeader());
}

export async function createPrestoInstances(data) {
    return await apiRequest('post', `${API_URL}sandbox/create-presto-instances`, data, getHeader());
}

export async function prestoRunBenchmark(data) {
    return await apiRequest('post', `${API_URL}sandbox/run-presto-benchmark`, data, getHeader());
}

export async function getPrestoRunLists(body) {
    return await apiRequest('get', `${API_URL}sandbox/list-presto-benchmark?page=${body.page}&count=${body.count}`, null, getHeader());
}

export async function deletePrestoInstances(data) {
    return await apiRequest('delete', `${API_URL}sandbox/delete-presto-instances`, data, getHeader());
}

export async function getPrestoBenchmarkStatus() {
    return await apiRequest('get', `${API_URL}sandbox/get-presto-benchmark-status`, null, getHeader());
}