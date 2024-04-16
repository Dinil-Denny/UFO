
function ifEquals(value1,value2,options){
    return (value1 === value2) ? options.fn(this) : options.inverse(this);
}

module.exports = {
    ifEquals : ifEquals
}
