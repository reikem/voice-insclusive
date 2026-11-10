// Braile grado 1 en español, con signos de puntuación y acentos.
const L: Record<string, string> = {
    a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',
    r:'⠗',s:'⠎',t:'⠞',u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵',ñ:'⠻',á:'⠷',é:'⠮',í:'⠌',ó:'⠬',ú:'⠾',ü:'⠳',
    '.':'⠲',',':'⠂',';':'⠆',':':'⠒','?':'⠢','¿':'⠢','!':'⠖','¡':'⠖','-':'⠤','(':'⠐⠣',')':'⠐⠜','"':'⠦','“':'⠦','”':'⠴',"'":'⠄',' ':' ',
  };

  const D ='⠚⠁⠃⠉⠙⠑⠋⠛⠓⠊'; // Letras de la A a la J
  const NUM='⠼', CAP= '⠠'; // Signos de número y mayúscula

  // Convierte un texto a Braille grado 1 en español, con signos de puntuación y acentos.
  export function toBraille(text: string): string {
    let out = '', inNum = false;
    for (const ch of text.normalize('NFC')) {
      if (/[0-9]/.test(ch)) { if (!inNum) out += NUM; out += D[+ch]; inNum = true; continue; }
      inNum = false;
      const lo = ch.toLowerCase();
      if (lo !== ch && L[lo]) out += CAP;
      out += L[lo] ?? (ch === '\n' ? '\n' : '');
    }
    return out;
  }

  // Convierte un caracter Braille a su representación en puntos (1-6).
  export const dotsOf = (c: string): number[] => {
    const v = c.codePointAt(0)! - 0x2800;
    return [1, 2, 3, 4, 5, 6].filter(n => v & (1 << (n - 1)));
  };