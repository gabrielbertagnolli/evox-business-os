$env:SUPABASE_ACCESS_TOKEN=$env:SUPABASE_ACCESS_TOKEN
$maxLoops = 30
for ($i = 0; $i -lt $maxLoops; $i++) {
    Write-Host "Running db push..."
    $output = npx supabase db push 2>&1 | Out-String
    Write-Host $output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success or no more migrations!"
        break
    }
    
    # Find the last "Applying migration" line
    $pattern = 'Applying migration (\d+)_[a-zA-Z0-9_]+\.sql'
    $matchesList = [regex]::Matches($output, $pattern)
    
    if ($matchesList.Count -gt 0) {
        $lastMatch = $matchesList[$matchesList.Count - 1].Groups[1].Value
        Write-Host "Repairing $lastMatch..."
        npx supabase migration repair --status applied $lastMatch 2>&1 | Out-String
    } else {
        Write-Host "Could not parse failed migration version."
        break
    }
}
