import{v as i}from"./chunk-JVFHGWPQ.js";import{N as n,S as r}from"./chunk-3QBWOERT.js";var o=[{name:"Salary",image:"assets/icons/salary.png",transactionType:"income"},{name:"Bonus",image:"assets/icons/bonus.png",transactionType:"income"},{name:"Investments",image:"assets/icons/investments.png",transactionType:"income"},{name:"Rental Income",image:"assets/icons/rental_income.png",transactionType:"income"},{name:"Freelance",image:"assets/icons/freelance.png",transactionType:"income"},{name:"Groceries",image:"assets/icons/groceries.png",transactionType:"expense"},{name:"Rent",image:"assets/icons/rent.png",transactionType:"expense"},{name:"Entertainment",image:"assets/icons/entertainment.png",transactionType:"expense"},{name:"Utilities",image:"assets/icons/utilities.png",transactionType:"expense"},{name:"Transport",image:"assets/icons/transport.png",transactionType:"expense"}];var s=class a{constructor(e){this.localStorageService=e}StorageKey="Categories";getCategories(){return this.localStorageService.get(this.StorageKey)?this.localStorageService.get(this.StorageKey):this.initCategories()}initCategories(){let e=o;return this.localStorageService.set(this.StorageKey,e),this.localStorageService.get(this.StorageKey)}getCategoryByType(e){let t=this.getCategories();return e===""?t:t.filter(c=>c.transactionType===e)}static \u0275fac=function(t){return new(t||a)(r(i))};static \u0275prov=n({token:a,factory:a.\u0275fac,providedIn:"root"})};export{s as a};