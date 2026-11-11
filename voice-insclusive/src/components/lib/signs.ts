// Dactilología (deletreo manual) local. Cada letra puede enlazar a un clip en assets/signs/<letra>.png.
export type Sign = { token: string; letter: boolean };
export function toFingerspelling(text: string): Sign[] {
    const t = text.toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'ñ');
    return [...t].filter(c => /[a-zñ0-9 ]/.test(c)).map(c => ({ token: c === ' ' ? '␣' : c.toUpperCase(), letter: c !== ' ' }));
}
