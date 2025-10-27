# Reset novels data in the database
# Usage: .\reset-novels.ps1

Write-Host "Fetching current novels data..." -ForegroundColor Yellow

try {
    # Get current novels list
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/novels" -Method GET
    $novels = $response.Content | ConvertFrom-Json
    
    Write-Host "Current database has $($novels.Count) novels" -ForegroundColor Green
    
    if ($novels.Count -gt 0) {
        Write-Host "Deleting all novels data..." -ForegroundColor Yellow
        
        # Delete all novels
        $deletedCount = 0
        foreach ($novel in $novels) {
            try {
                $deleteResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/novels/$($novel._id)" -Method DELETE
                if ($deleteResponse.StatusCode -eq 200) {
                    $deletedCount++
                    Write-Host "Deleted novel: $($novel.title)" -ForegroundColor Green
                }
            } catch {
                Write-Host "Failed to delete novel: $($novel.title) - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host "Successfully deleted $deletedCount novels" -ForegroundColor Green
    } else {
        Write-Host "No novels data in database" -ForegroundColor Yellow
    }
    
    # Final check
    $finalResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/novels" -Method GET
    $finalNovels = $finalResponse.Content | ConvertFrom-Json
    Write-Host "Remaining novels in database after deletion: $($finalNovels.Count)" -ForegroundColor Green
    
    Write-Host "Operation completed!" -ForegroundColor Cyan
}
catch {
    Write-Host "Error during operation: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}