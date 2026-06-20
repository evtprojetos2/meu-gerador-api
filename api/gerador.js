const cheerio = require('cheerio');

export default async function handler(req, res) {
    // Configurações para permitir acesso de qualquer lugar (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Link exato do seu arquivo PHP que contém o HTML gerado
    const targetUrl = 'https://xsender.painelmaster.lol/card3.php';

    try {
        // O fetch simula um navegador Chrome real para evitar a mensagem de "Acesso negado" do PHP
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Erro ao acessar o site de origem.' });
        }

        const htmlContent = await response.text();

        // Carrega o HTML baixado no Cheerio para ler as tags
        const $ = cheerio.load(htmlContent);
        const jogos = [];

        // Extrai os blocos de jogos
        $('.jogo-card').each((index, element) => {
            const card = $(element);
            const timeBoxes = card.find('.time-box');
            
            if (timeBoxes.length < 2) return;

            const time1Box = $(timeBoxes[0]);
            const time2Box = $(timeBoxes[1]);

            // Dados do Time 1
            const time1 = time1Box.find('p').text().trim();
            const img_time1_url = time1Box.find('img').attr('src') || "";
            const placar_time1 = time1Box.find('.placar').text().trim();

            // Dados do Time 2
            const time2 = time2Box.find('p').text().trim();
            const img_time2_url = time2Box.find('img').attr('src') || "";
            const placar_time2 = time2Box.find('.placar').text().trim();

            // Dados do Jogo
            const competicao = card.find('.campeonato').text().trim();
            const horario = card.find('.hora').text().trim();
            
            // Tratamento dos Canais
            let canais = [];
            const canalContainer = card.find('.canal-container');
            if (canalContainer.length > 0) {
                const dataCanais = canalContainer.attr('data-canais');
                if (dataCanais) {
                    try {
                        canais = JSON.parse(dataCanais);
                    } catch (e) {
                        console.error("Erro ao processar canais");
                    }
                }
            }

            // Status do Jogo
            const statusDiv = card.find('.status-fim');
            const status = statusDiv.length > 0 ? statusDiv.text().trim() : "";

            // Montagem do objeto JSON mantendo a ordem exata das chaves exigida
            const jogoInfo = {
                "canais": canais,
                "competicao": competicao,
                "data_jogo": "hoje",
                "destaque": false,
                "horario": horario,
                "img_competicao_url": "", 
                "img_time1_url": img_time1_url,
                "img_time2_url": img_time2_url,
                "placar_time1": placar_time1,
                "placar_time2": placar_time2,
                "status": status,
                "time1": time1,
                "time2": time2
            };

            jogos.push(jogoInfo);
        });

        // Retorna o JSON final, formatado e identado
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).send(JSON.stringify(jogos, null, 2));

    } catch (error) {
        return res.status(500).json({ error: 'Erro interno no servidor Vercel', detalhes: error.message });
    }
}
