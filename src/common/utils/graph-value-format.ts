export function graphValueFormat(valueFieldFromGraph: string): string {
  return valueFieldFromGraph
    .replace(/[<>]/g, '')
    .replace('did:web:', '')
    .replace(/https?:\/\//, '')
    .replace(/:/g, '/')
}
