import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
export function createFakeD1() {
 const sqlite = new DatabaseSync(':memory:');
 sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
 function prepare(sql, values = []) {
  const statement = sqlite.prepare(sql);
  return {
   bind(...args) { return prepare(sql, args); },
   async all() { return {results: statement.all(...values).map(row => ({...row})), success:true}; },
   async first() { const row=statement.get(...values); return row ? {...row} : null; },
   async run() { const result=statement.run(...values);return {success:true, meta:{changes:Number(result.changes), last_row_id:Number(result.lastInsertRowid)}}; },
  };
 }
 return {prepare, async batch(statements) {
  sqlite.exec('BEGIN');
  try { const result=[];for(const s of statements) result.push(await s.run());sqlite.exec('COMMIT');return result; }
  catch(error) {sqlite.exec('ROLLBACK');throw error;}
 }, close() {sqlite.close();}};
}
