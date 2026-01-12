const obj = {
  firstName: 'John',
  lastName: 'Doe'
}
function showObjectParams(obj) {
  for(const paramId in obj) {
    const param = obj[paramId];
    console.log(paramId + ': ' + param);
  }
}