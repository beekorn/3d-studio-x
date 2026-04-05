cd D:\mobile-hub\projects\3d-studio-x
git config user.email "warren@example.com"
git config user.name "Warren"
git add -A
git commit -m "Fix JSX static deploy"

$settings = Get-Content D:\mobile-hub\settings.json | ConvertFrom-Json
$token = $settings.githubToken
git remote set-url origin "https://$($token)@github.com/beekorn/3d-studio-x.git"
git push origin master
Write-Host "DONE: $LASTEXITCODE"
