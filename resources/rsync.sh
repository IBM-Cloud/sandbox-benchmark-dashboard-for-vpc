#!/bin/bash

git config --global user.email "$GIT_USER_EMAIL"
git config --global user.name "$GIT_USER_NAME"

# Configuration
PRIVATE_REPO_URL="https://${GITHUB_TOKEN}@github.ibm.com/workload-eng-services/sandbox-ui.git"
PUBLIC_REPO_URL="https://${GIT_USER_NAME}:${GITHUB_TOKEN1}@github.com/IBM-Cloud/sandbox-benchmark-dashboard-for-vpc.git"
PRIVATE_REPO_PATH="/workspace/private"
PUBLIC_REPO_PATH="/workspace/public"
BRANCH_NAME="${Branch}"

# Function to check if a command was successful
check_command() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

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

echo "Cleaning up private repository directory..."
rm -rf "$PRIVATE_REPO_PATH"
rm -rf "$PUBLIC_REPO_PATH"
