export const dateToStr = (dateVal) => {
  let res = '';
  res += (dateVal.getDate() + '').pad(2);
  res += '-' + ((dateVal.getMonth() + 1) + '').pad(2);
  res += '-' + (dateVal.getFullYear() + '').pad(4);
  res += ' ' + (dateVal.getHours() + '').pad(2);
  res += ':' + (dateVal.getMinutes() + '').pad(2);
  res += ':' + (dateVal.getSeconds() + '').pad(2);
  return res;
}
export const strToDate = (dateVal) => {
  const day = dateVal.slice(0,2);
  const month = dateVal.slice(3,5);
  const rest = dateVal.slice(6);
  return new Date(`${month}-${day}-${rest}`);
}
