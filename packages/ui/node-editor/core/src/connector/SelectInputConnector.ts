
class SelectInputConnector extends InputConnector{
    createInput(key, data, value){
        let input = document.createElement("select");
        for(var k in data.values){
            var option = document.createElement("option");
            option.setAttribute("value", k);
            option.innerHTML = data.values[k];
            if(data.values && data.values[key] === k){
                option.setAttribute("selected",null);
            }
            input.appendChild(option);
        }
        input.placeholder = data.name || key;
        return input;
    }
}