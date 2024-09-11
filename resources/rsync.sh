#!/bin/bash

git config --global user.email "gaurav.aggarval9@ibm.com"
git config --global user.name "gaurav-ibm-sa"

# Configuration
PRIVATE_REPO_HTTPS="https://github.ibm.com/workload-eng-services/sandbox-ui.git"
PUBLIC_REPO_URL="https://gaurav-ibm-sa:${GITHUB_TOKEN1}@github.com/IBM-Cloud/sandbox-benchmark-dashboard-for-vpc.git"
PRIVATE_REPO_PATH="/workspace/private"
PUBLIC_REPO_PATH="/workspace/public"
BRANCH_NAME="subrepo"

# Function to check if a command was successful
check_command() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Diagnostic function
run_diagnostics() {
    echo "Running diagnostics..."
    echo "Checking SSH_PRIVATE_KEY environment variable:"
    if [ -z "$SSH_PRIVATE_KEY" ]; then
        echo "SSH_PRIVATE_KEY is not set"
    else
        echo "SSH_PRIVATE_KEY is set (value not shown for security)"
    fi
    echo "Checking GITHUB_TOKEN environment variable:"
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "GITHUB_TOKEN is not set"
    else
        echo "GITHUB_TOKEN is set (value not shown for security)"
    fi
    echo "Git version:"
    git --version
    echo "Current user:"
    whoami
}

# Set up SSH key from environment variable
setup_ssh_key() {
    if [ -n "$SSH_PRIVATE_KEY" ]; then
        echo "Setting up SSH key..."
        mkdir -p ~/.ssh
        echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
        chmod 600 ~/.ssh/id_rsa
        eval $(ssh-agent -s)
        ssh-add ~/.ssh/id_rsa
        return 0
    else
        echo "SSH_PRIVATE_KEY not set, falling back to HTTPS"
        return 1
    fi
}

# Run diagnostics
run_diagnostics

# Determine which authentication method to use
if setup_ssh_key; then
    PRIVATE_REPO_URL="$PRIVATE_REPO_SSH"
elif [ -n "$GITHUB_TOKEN" ]; then
    PRIVATE_REPO_URL="https://${GITHUB_TOKEN}@github.ibm.com/workload-eng-services/sandbox-ui.git"
else
    echo "Error: Neither SSH_PRIVATE_KEY nor GITHUB_TOKEN is set. Cannot authenticate."
    exit 1
fi

# Ensure the repository paths exist
mkdir -p "$PRIVATE_REPO_PATH"
mkdir -p "$PUBLIC_REPO_PATH"

# Clone repositories if not already cloned
if [ ! -d "$PRIVATE_REPO_PATH/.git" ]; then
    echo "Cloning private repository..."
    git clone "$PRIVATE_REPO_URL" "$PRIVATE_REPO_PATH"
    check_command "Failed to clone private repository"
fi

if [ ! -d "$PUBLIC_REPO_PATH/.git" ]; then
    echo "Cloning public repository..."
    git clone "$PUBLIC_REPO_URL" "$PUBLIC_REPO_PATH"
    check_command "Failed to clone public repository"
fi

# Pull latest changes from the private repo
cd "$PRIVATE_REPO_PATH"
git checkout $BRANCH_NAME
check_command "Failed to checkout branch $BRANCH_NAME in private repo"
git pull origin $BRANCH_NAME
check_command "Failed to pull changes from private repo"

# Copy changes to the public repo
cd "$PUBLIC_REPO_PATH"
git checkout $BRANCH_NAME
check_command "Failed to checkout branch $BRANCH_NAME in public repo"
git pull origin $BRANCH_NAME
check_command "Failed to pull changes from public repo"

# Sync the changes
cd "$PRIVATE_REPO_PATH"
for item in *; do
    if [ -d "$item" ]; then
        cp -r "$item" "$PUBLIC_REPO_PATH/"
    else
        cp "$item" "$PUBLIC_REPO_PATH/"
    fi
done

# Add, commit, and push changes to the public repo
cd "$PUBLIC_REPO_PATH"
git add .
git commit -m "Syncing changes from private repo: $(date)"
check_command "Failed to commit changes to public repo"
git push origin $BRANCH_NAME
check_command "Failed to push changes to public repo"

echo "Changes successfully synced from private to public repo!"
