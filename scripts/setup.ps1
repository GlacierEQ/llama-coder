# This script checks for Node.js, npm, and yarn. It installs Yarn via npm if missing,
# then installs project dependencies using yarn.
# Run this script in a PowerShell window.

function Check-Command {
    param ([string]$cmd)
    $command = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        Write-Host "$cmd not found."
        return $false
    } else {
        Write-Host "$cmd is installed."
        return $true
    }
}

# Check for Node and npm
$nodeExists = Check-Command "node"
$npmExists  = Check-Command "npm"

if (-not $nodeExists -or -not $npmExists) {
    Write-Host "Node.js (and npm) are required. Please download and install Node.js from https://nodejs.org/ and restart your terminal."
    exit 1
}

# Check for yarn and install if not found
$yarnExists = Check-Command "yarn"
if (-not $yarnExists) {
    Write-Host "Yarn is not installed. Installing Yarn globally via npm..."
    npm install -g yarn
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Yarn installation failed. Please install Yarn manually from https://classic.yarnpkg.com/en/docs/install/"
        exit 1
    } else {
        Write-Host "Yarn installed successfully."
    }
}

Write-Host "Installing project dependencies..."
yarn install

if ($LASTEXITCODE -ne 0) {
    Write-Host "yarn install encountered errors. Please check your setup."
    exit 1
} else {
    Write-Host "Dependencies installed successfully."
    Write-Host "To compile the project, run: yarn run compile"
}
