$body = @{
    userId = "test-user-123"
    message = "I had 2 eggs and a glass of milk for breakfast today."
}

$jsonBody = $body | ConvertTo-Json
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/chat/process' -Method POST -Body $jsonBody -ContentType 'application/json'

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"