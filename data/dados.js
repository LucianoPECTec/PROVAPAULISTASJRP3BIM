// COLE AQUI, NA LINHA ABAIXO, A LINHA COMPLETA QUE COMEÇA COM:
// const D={"comps":...
// Ela está no seu index.html atual.

const D = COLE_AQUI_A_LINHA_DO_SEU_INDEX_ATUAL;

window.PROVA_PAULISTA = {
  meta: {
    titulo: "Jornada da Prova Paulista",
    bimestre: "3º Bimestre",
    ano: 2026,
    fonte: "Escola Total / SEDUC-SP",
    base: "Prova Paulista — 3º Bimestre",
    dataExtracao: "01/10/2026",
    dataAtualizacao: "02/10/2026",
    responsavel: "URE São José do Rio Preto / SEDUC-SP"
  },
  componentes: D.comps,
  escolas: D.rows.map(r => ({
    nome: r[0],
    alunos: r[1],
    participacao: r[2],
    resultadoGeral: r[3],
    resultados: r[4]
  }))
};
