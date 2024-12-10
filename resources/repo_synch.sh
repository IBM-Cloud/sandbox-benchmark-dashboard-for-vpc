#!/bin/bash

# Configuration for GitHub user
git config --global user.email "$GIT_USER_EMAIL"
git config --global user.name "$GIT_USER_NAME"

# Configuration
PRIVATE_REPO_URL="https://${GITHUB_TOKEN}@github.ibm.com/workload-eng-services/sandbox-ui.git"
PUBLIC_REPO_URL="https://${GIT_USER_NAME}:${GITHUB_TOKEN1}@github.com/IBM-Cloud/sandbox-benchmark-dashboard-for-vpc.git"
PRIVATE_REPO_PATH="/workspace/private"
PUBLIC_REPO_PATH="/workspace/public"
BRANCH_NAME="${BRANCH}"

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
git checkout "$BRANCH_NAME"
check_command "Failed to checkout branch $BRANCH_NAME in private repo"
git pull origin "$BRANCH_NAME"
check_command "Failed to pull changes from private repo"
cd "$PUBLIC_REPO_PATH"

# Ensure we are on the main branch and update it
git fetch origin
git checkout main
check_command "Failed to checkout main branch in public repo"
git pull origin main
check_command "Failed to pull changes from main branch in public repo"

# Create or checkout the branch in the public repo
if git show-ref --verify --quiet refs/remotes/origin/"$BRANCH_NAME"; then
    # Branch exists on remote, check it out
    git checkout "$BRANCH_NAME"
    check_command "Failed to checkout branch $BRANCH_NAME in public repo"
else
    # Branch does not exist, create it from main
    git checkout -b "$BRANCH_NAME"
    check_command "Failed to create new branch $BRANCH_NAME from main in public repo"
    git push origin "$BRANCH_NAME"
    check_command "Failed to push new branch $BRANCH_NAME to public repo"
fi

# Pull the latest changes from the branch
git pull origin "$BRANCH_NAME"
check_command "Failed to pull changes from branch $BRANCH_NAME in public repo"

# Copy changes from the private repo to the public repo
cd "$PRIVATE_REPO_PATH"
for item in *; do
    if [ -d "$item" ]; then
        cp -r "$item" "$PUBLIC_REPO_PATH/"
    else
        cp "$item" "$PUBLIC_REPO_PATH/"
    fi
done

cd "$PUBLIC_REPO_PATH"
# Remove rsync.sh file if it exists in the public repo
if [ -f "$PUBLIC_REPO_PATH/resources/rsync.sh" ]; then
    rm "$PUBLIC_REPO_PATH/resources/rsync.sh"
    check_command "Failed to remove rsync.sh from public repo"
fi

# Add, commit, and push changes to the public repo
git add .
if git diff --cached --quiet; then
    echo "No changes to commit."
else
    git commit -m "Syncing changes from private repo: $(date)"
    check_command "Failed to commit changes to public repo"
    git push origin "$BRANCH_NAME"
    check_command "Failed to push changes to public repo"
    echo "Changes successfully synced from private to public repo!"
fi    

# Set variables
PR_TITLE="Sync changes from ${BRANCH_NAME} to ${MAIN_BRANCH}"
PR_BODY="This pull request syncs changes from branch ${BRANCH_NAME} to the main branch."
REPO="IBM-Cloud/sandbox-benchmark-dashboard-for-vpc"
API_URL="https://api.github.com/repos/$REPO"

# Create pull request
echo "Creating pull request..."
PR_RESPONSE=$(curl -s -X POST "$API_URL/pulls" \
  -H "Authorization: token $GITHUB_TOKEN1" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{
    \"title\": \"$PR_TITLE\",
    \"body\": \"$PR_BODY\",
    \"head\": \"$BRANCH_NAME\",
    \"base\": \"$MAIN_BRANCH\"
  }")

# Extract pull request number
PR_NUMBER=$(echo $PR_RESPONSE | jq -r .number)

if [ -z "$PR_NUMBER" ] || [ "$PR_NUMBER" == "null" ]; then
  echo "Failed to create pull request. Response: $PR_RESPONSE"
  exit 1
fi

echo "Pull request #$PR_NUMBER created successfully."

# Convert space-separated reviewers to JSON array
REVIEWERS_JSON=$(echo $REVIEWERS | jq -R 'split(" ")')

# Add reviewers
echo "Adding reviewers..."
REVIEWER_RESPONSE=$(curl -s -X POST "$API_URL/pulls/$PR_NUMBER/requested_reviewers" \
  -H "Authorization: token $GITHUB_TOKEN1" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{
    \"reviewers\": $REVIEWERS_JSON
  }")

echo "Reviewer addition response: $REVIEWER_RESPONSE"

echo "PR raised successfully and sent $REVIEWERS to Review"

#echo "Cleaning up repository directory..."
rm -rf "$PRIVATE_REPO_PATH"
rm -rf "$PUBLIC_REPO_PATH"
