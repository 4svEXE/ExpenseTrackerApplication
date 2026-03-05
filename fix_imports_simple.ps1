$files = Get-ChildItem -Recurse -Filter "*.ts" -Path "C:\Projects\Неактивні проекти\ExpenseTrackerApplication\src\app"
foreach ($file in $files) {
    Try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        
        $changed = $false
        
        # db/transactions -> db/transactions-list.data
        if ($content -match "/db/transactions") {
            $content = $content.Replace("/db/transactions", "/db/transactions-list.data")
            $changed = $true
        }
        if ($content -match "/db/Transactions") {
            $content = $content.Replace("/db/Transactions", "/db/transactions-list.data")
            $changed = $true
        }
        
        # db/categories -> db/categories-list.data
        if ($content -match "/db/categories") {
            $content = $content.Replace("/db/categories", "/db/categories-list.data")
            $changed = $true
        }
        if ($content -match "/db/Categories") {
            $content = $content.Replace("/db/Categories", "/db/categories-list.data")
            $changed = $true
        }
        
        # types/transaction -> types/transaction.interface
        if ($content -match "/types/transaction'") {
            $content = $content.Replace("/types/transaction'", "/types/transaction.interface'")
            $changed = $true
        }
        if ($content -match "/types/Transaction'") {
            $content = $content.Replace("/types/Transaction'", "/types/transaction.interface'")
            $changed = $true
        }
        if ($content -match '/types/transaction"') {
            $content = $content.Replace('/types/transaction"', '/types/transaction.interface"')
            $changed = $true
        }
        if ($content -match '/types/Transaction"') {
            $content = $content.Replace('/types/Transaction"', '/types/transaction.interface"')
            $changed = $true
        }

        # types/transaction-type -> types/transaction-type.enum
        if ($content -match "/types/transaction-type") {
            $content = $content.Replace("/types/transaction-type", "/types/transaction-type.enum")
            $changed = $true
        }
        if ($content -match "/types/TransactionType") {
            $content = $content.Replace("/types/TransactionType", "/types/transaction-type.enum")
            $changed = $true
        }

        # types/transaction-category -> types/transaction-category.interface
        if ($content -match "/types/transaction-category") {
            $content = $content.Replace("/types/transaction-category", "/types/transaction-category.interface")
            $changed = $true
        }
        if ($content -match "/types/TransactionCategory") {
            $content = $content.Replace("/types/TransactionCategory", "/types/transaction-category.interface")
            $changed = $true
        }
        
        # Simple replacements for internal files
        $content = $content.Replace('"./transaction-type"', '"./transaction-type.enum"')
        $content = $content.Replace('"./TransactionType"', '"./transaction-type.enum"')
        $content = $content.Replace("'./transaction-type'", "'./transaction-type.enum'")
        $content = $content.Replace("'./TransactionType'", "'./transaction-type.enum'")

        if ($changed) {
            echo "Updating $($file.Name)"
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        }
    }
    Catch {
        echo "Error on $($file.Name): $($_.Exception.Message)"
    }
}
