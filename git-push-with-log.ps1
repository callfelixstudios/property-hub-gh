param (
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

Write-Host "Starting Git Push Process..."
$success = $false

if ($DryRun) {
    Write-Host "[Dry-Run] git push would execute here."
    $success = $true
} else {
    & git push
    $success = $?
}

if ($success) {
    Write-Host "Git push successful. Generating Obsidian update log..."
    
    $date = Get-Date -Format "yyyy-MM-dd"
    $filename = "$date-milestone-update.md"
    $targetDir = "C:\Users\CallFELIX\Documents\PROJECT\property-hub-gh\obsidian-vault"
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }
    
    $targetPath = Join-Path $targetDir $filename
    
    if (-not $DryRun) {
        $summary = git log -1 --pretty=format:"%s"
        $files = git log -1 --name-only --pretty=format:"" | Where-Object { $_ -match "\S" }
    } else {
        $summary = "[Dry-Run] Initial release commit"
        $files = @("src/app/page.tsx", "src/components/ui/button.tsx")
    }
    
    $fileListStr = ($files | ForEach-Object { "- $_" }) -join "`n"

    $content = @"
# 1. Milestone Summary
$summary

# 2. Files Modified
$fileListStr

# 3. Data/UI Architecture State
(Agent: Document current active object states here, e.g., "Neighborhood field transitioned from text input to searchable combobox bound to local region data presets")

# 4. Next Immediate Steps
(Agent: List remaining goals for the active feature branch)
"@

    $content | Out-File -FilePath $targetPath -Encoding utf8
    Write-Host "Successfully generated log at: $targetPath"
} else {
    Write-Error "Git push failed. Obsidian log generation aborted."
}
