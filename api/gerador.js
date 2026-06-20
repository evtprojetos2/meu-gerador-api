const cheerio = require('cheerio');

export default async function handler(req, res) {
    // Configuração de CORS para permitir acesso de qualquer lugar
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    // Responde ao preflight do CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let htmlContent = '';

    // Lê o HTML dependendo de como a requisição foi feita
    if (req.method === 'POST') {
        htmlContent = req.body.html || req.body;
    } else if (req.method === 'GET' && req.query.url) {
        try {
            const response = await fetch(req.query.url);
            htmlContent = await response.text();
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar a URL informada.' });
        }
    } else {
        return res.status(400).json({ 
            error: 'Uso incorreto. Envie o HTML via POST (body) ou via GET (passando ?url=URL_DO_SEU_SITE).' 
        });
    }

    if (!htmlContent || typeof htmlContent !== 'string') {
        return res.status(400).json({ error: 'Conteúdo HTML inválido ou vazio.' });
    }

    // Carrega o HTML no Cheerio para extração
    const $ = cheerio.load(htmlContent);
    const jogos = [];

    $('.jogo-card').each((index, element) => {
        const card = $(element);
        const timeBoxes = card.find('.time-box');
        
        if (timeBoxes.length < 2) return;

        const time1Box = $(timeBoxes[0]);
        const time2Box = $(timeBoxes[1]);

        const time1 = time1Box.find('p').text().trim();
        const img_time1_url = time1Box.find('img').attr('src') || "";
        const placar_time1 = time1Box.find('.placar').text().trim();

        const time2 = time2Box.find('p').text().trim();
        const img_time2_url = time2Box.find('img').attr('src') || "";
        const placar_time2 = time2Box.find('.placar').text().trim();

        const competicao = card.find('.campeonato').text().trim();
        const horario = card.find('.hora').text().trim();
        
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

        const statusDiv = card.find('.status-fim');
        const status = statusDiv.length > 0 ? statusDiv.text().trim() : "";

        // Objeto com a ORDEM EXATA das chaves solicitada
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

    // Retorna o JSON com formatação bonita (indentação 2) mantendo a ordem das chaves
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(jogos, null, 2));
}
