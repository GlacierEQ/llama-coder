# This script checks for Node.js, npm, and Yarn. If Yarn is missing it will
# install it via npm, then install project dependencies using Yarn. The script
# avoids terminating the shell on failure and instead prints a message so you
# can address issues manually.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

function Check-Version {
    param (
        [string]$cmd,
        [Version]$minVersion
    )

    $versionOutput = & $cmd --version
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$cmd --version failed."
        return $false
    }

    $versionString = $versionOutput -replace '^v', ''
    try {
        $version = [Version]$versionString
    } catch {
        Write-Host "Unable to parse version for $cmd: $versionString"
        return $false
    }

    if ($version -lt $minVersion) {
        Write-Host "$cmd version $version is less than required $minVersion."
        return $false
    }

    Write-Host "$cmd version $version meets requirement."
    return $true
}

# Main setup steps are wrapped in a try/catch block so errors don't terminate the
# shell session.
try {
    # Check for Node and npm
    $nodeExists = Check-Command "node"
    $npmExists  = Check-Command "npm"

    if (-not $nodeExists -or -not $npmExists) {
        Write-Host "Node.js (and npm) are required. Please download and install Node.js from https://nodejs.org/ and restart your terminal."
        return
    }

    $nodeOk = Check-Version "node" ([Version]"16.0.0")
    if (-not $nodeOk) {
        Write-Host "Please install Node.js 16 or newer."
        return
    }

    # Check for yarn and install if not found
    $yarnExists = Check-Command "yarn"
    if (-not $yarnExists) {
        Write-Host "Yarn is not installed. Installing Yarn globally via npm..."
        npm install -g yarn
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Yarn installation failed. Please install Yarn manually from https://classic.yarnpkg.com/en/docs/install/"
            return
        } else {
            Write-Host "Yarn installed successfully."
        }
    }

    $yarnOk = Check-Version "yarn" ([Version]"1.22.0")
    if (-not $yarnOk) {
        Write-Host "Yarn 1.22 or newer is required."
        return
    }

    Write-Host "Installing project dependencies..."
    yarn install

    if ($LASTEXITCODE -ne 0) {
        Write-Host "yarn install encountered errors. Please check your setup."
        return
    } else {
        Write-Host "Dependencies installed successfully."
        Write-Host "To compile the project, run: yarn run compile"
    }
} catch {
    Write-Host "Setup failed: $_"
    return
}
