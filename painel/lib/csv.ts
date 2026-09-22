/**
 * Leitura tolerante de CSV para a importação da base antiga.
 * Reconhece o delimitador (vírgula, ponto e vírgula ou tab — o Excel em
 * português costuma usar ponto e vírgula), respeita aspas e mapeia as colunas
 * por nome do cabeçalho. Sem cabeçalho reconhecível, assume a ordem
 * nome, telefone, e-mail, interesse, observações.
 */

export interface ParsedLead {
  name: string;
  phone?: string;
  email?: string;
  interest?: string;
  notes?: string;
}

export type LeadField = keyof ParsedLead;

const FIELD_ORDER: LeadField[] = ['name', 'phone', 'email', 'interest', 'notes'];

/** Rótulos (sem acento, minúsculos) que apontam para cada campo. */
const FIELD_ALIASES: Record<LeadField, string[]> = {
  name: ['nome', 'name', 'cliente', 'contato', 'nome completo', 'nome do cliente', 'full name', 'lead'],
  phone: ['telefone', 'phone', 'celular', 'whatsapp', 'fone', 'telefone celular', 'numero', 'tel', 'mobile', 'contato telefone'],
  email: ['email', 'e-mail', 'e mail', 'mail', 'correio'],
  interest: ['interesse', 'imovel', 'empreendimento', 'produto', 'codigo', 'codigo do imovel', 'interesse do lead', 'busca'],
  notes: ['observacao', 'observacoes', 'obs', 'notas', 'notes', 'comentario', 'comentarios', 'anotacoes', 'detalhes'],
};

const strip = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

function detectDelimiter(text: string): string {
  const end = text.indexOf('\n');
  const firstLine = end === -1 ? text : text.slice(0, end);
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === ',' || ch === ';' || ch === '\t')) counts[ch] += 1;
  }
  const best = Object.keys(counts).sort((a, b) => counts[b]! - counts[a]!)[0]!;
  return counts[best]! > 0 ? best : ',';
}

/** Quebra o texto do CSV em uma grade de células (linhas × colunas). */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, ''); // remove BOM do Excel
  const delim = detectDelimiter(t);
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  const pushRow = () => {
    row.push(field);
    field = '';
    if (row.some((c) => c.trim() !== '')) rows.push(row); // ignora linhas vazias
    row = [];
  };

  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i += 1;
      pushRow();
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) pushRow();
  return rows;
}

export interface MappedCsv {
  rows: ParsedLead[];
  /** true se a primeira linha foi tratada como cabeçalho. */
  hadHeader: boolean;
  /** Campo atribuído a cada coluna, na ordem lida. */
  columns: (LeadField | null)[];
}

function matchHeader(header: string): LeadField | null {
  const n = strip(header);
  if (!n) return null;
  for (const field of FIELD_ORDER) {
    const aliases = FIELD_ALIASES[field];
    if (aliases.includes(n)) return field;
  }
  // casamento parcial (ex.: "telefone (celular)")
  for (const field of FIELD_ORDER) {
    if (FIELD_ALIASES[field].some((a) => n.includes(a))) return field;
  }
  return null;
}

/** Converte a grade do CSV em leads, mapeando as colunas pelo cabeçalho. */
export function mapCsvToLeads(grid: string[][]): MappedCsv {
  if (grid.length === 0) return { rows: [], hadHeader: false, columns: [] };

  const first = grid[0]!;
  const detected = first.map(matchHeader);
  const hadHeader = detected.includes('name'); // só é cabeçalho se achamos a coluna de nome
  const columns: (LeadField | null)[] = hadHeader
    ? detected
    : first.map((_, i) => FIELD_ORDER[i] ?? null);
  const body = hadHeader ? grid.slice(1) : grid;

  const rows: ParsedLead[] = body.map((line) => {
    const lead: ParsedLead = { name: '' };
    columns.forEach((field, idx) => {
      if (!field) return;
      const val = (line[idx] ?? '').trim();
      if (val) lead[field] = val;
    });
    return lead;
  });

  return { rows, hadHeader, columns };
}
