// 补充前导 0
export function fillWithZero(num, length: number) {
    let numlength = num.toString().length;
    if (numlength < length) {
        return new Array(length - numlength + 1).join('0') + num
    }
    return num.toString();
}