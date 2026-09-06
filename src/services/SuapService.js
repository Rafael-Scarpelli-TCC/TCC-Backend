const SUAP_AUTH_URL = 'https://suap.ifpr.edu.br/o/authorize/';

export const gerarUrlLoginSuap = () => {
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: process.env.SUAP_CLIENT_ID,
    redirect_uri: process.env.SUAP_REDIRECT_URI,
    scope: 'identificacao',
  });

  return `${SUAP_AUTH_URL}?${params.toString()}`;
};