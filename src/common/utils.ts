export const getGuID =() =>{
    return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, function () {
      const r = (Math.random() * 16) | 0;
      return r.toString(16).toUpperCase();
    });
  }