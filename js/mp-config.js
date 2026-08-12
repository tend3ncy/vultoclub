// Configuração do Mercado Pago
// Troque entre 'test' e 'production' conforme necessário

const MP_CONFIG = {
  mode: 'production', // 'test' ou 'production'
  
  // Credenciais de TESTE
  test: {
    publicKey: 'TEST-sua-chave-publica-aqui'
  },
  
  // Credenciais de PRODUÇÃO
  production: {
    publicKey: 'APP_USR-50329b79-a8a0-496a-83bd-66bd6623ed27'
  },
  
  // Retorna a chave pública baseada no modo
  getPublicKey() {
    return this[this.mode].publicKey;
  }
};
