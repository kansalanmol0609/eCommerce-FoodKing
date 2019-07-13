document.querySelector('#plus').addEventListener('click', (e)=>{
    e.preventDefault()
    var quantity = Number(document.getElementById('quantity').value) 
    quantity += 1
    var price = Number(document.getElementById('priceCount').value)
    price += Number(document.getElementById('priceInd').value)
    document.querySelector('#total').textContent = quantity
    document.getElementById('quantity').value = quantity
    document.getElementById('priceCount').value = price
})

document.querySelector('#minus').addEventListener('click', (e)=>{
    e.preventDefault()
    var quantity = Number(document.getElementById('quantity').value) 
    if(quantity==1) return;
    quantity -= 1
    var price = Number(document.getElementById('priceCount').value)
    price -= Number(document.getElementById('priceInd').value)
    document.querySelector('#total').textContent = quantity
    document.getElementById('quantity').value = quantity
    document.getElementById('priceCount').value = price
})