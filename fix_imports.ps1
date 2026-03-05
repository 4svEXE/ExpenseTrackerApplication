$files = Get-ChildItem -Recurse -Filter "*.ts" -Path "C:\Projects\Неактивні проекти\ExpenseTrackerApplication\src\app"
foreach ($file in $files) {
    echo "Processing $($file.FullName)"
    $content = Get-Content $file.FullName -Raw
    
    # db/transactions -> db/transactions-list
    $content = $content -replace "db/transactions(['\"])", "db/transactions-list`$1"
    $content = $content -replace "db/Transactions(['\"])", "db/transactions-list`$1"
    
    # db/categories -> db/categories-list
    $content = $content -replace "db/categories(['\"])", "db/categories-list`$1"
    $content = $content -replace "db/Categories(['\"])", "db/categories-list`$1"
    
    # types/transaction -> types/transaction-model
    $content = $content -replace "types/transaction(['\"])", "types/transaction-model`$1"
    $content = $content -replace "types/Transaction(['\"])", "types/transaction-model`$1"
    
    # types/transaction-type -> types/transaction-type-enum
    $content = $content -replace "types/transaction-type(['\"])", "types/transaction-type-enum`$1"
    $content = $content -replace "types/TransactionType(['\"])", "types/transaction-type-enum`$1"
    
    # types/transaction-category -> types/transaction-category-data
    $content = $content -replace "types/transaction-category(['\"])", "types/transaction-category-data`$1"
    $content = $content -replace "types/TransactionCategory(['\"])", "types/transaction-category-data`$1"
    
    # Internal imports within types/ (like ./TransactionType)
    $content = $content -replace '"\./transaction-type"', '"./transaction-type-enum"'
    $content = $content -replace '"\./TransactionType"', '"./transaction-type-enum"'
    $content = $content -replace "'\./transaction-type'", "'./transaction-type-enum'"
    $content = $content -replace "'\./TransactionType'", "'./transaction-type-enum'"
    
    Set-Content $file.FullName $content -Encoding UTF8
}
