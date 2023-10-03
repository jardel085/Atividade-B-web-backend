const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const tesseract = require('tesseract.js');
const PDFDocument = require('pdfkit');


const app = express();
const port = process.env.PORT || 3000;


// Substitua "<password>" e "suaURLdoMongoDB" pelas informações reais
const username = 'jardelleite';
const password = 'if086715'; // Substitua por sua senha real
const dbName = 'Projeto_0'; // Substitua pelo nome do banco de dados que deseja conectar

// Construa a URL de conexão corretamente
const url =`mongodb+srv://${username}:${password}@cluster0.umejfvd.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conexão com o MongoDB Atlas bem-sucedida');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB Atlas:', err);
  });

mongoose.Promise = global.Promise; // Define a biblioteca de promessas a ser usada


// Configuração do Multer para fazer upload de imagens
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Defina seus modelos de dados do MongoDB aqui

app.use(express.json());

// Defina suas rotas aqui
// importando o modelo de placa
const Placa = require('./placa');

app.post('/cadastroPlaca', upload.single('foto'), async (req, res) => {
  try {
    const {data} = await tesseract.recognize(req.file.buffer, 'eng', { logger: m => console.log(m) });

    const { cidade} = req.body;
    const numeroPlaca = data.trim();

    // salvar os dados no mongodb
    const placa = new Placa({
      numeroPlaca, 
      cidade,
      dataHora: new Date(),
   });

   await placa.save();

   res.status(201).json({mensagem:'placa cadastrada com sucesso'});
  } catch (error) {
    console.log("Erro", error);
  res.status(500).json({erro: 'erro no servidor'});

  }
});

// Rota para gerar um PDF de relatório para uma cidade específica
app.get('/relatorio/cidade/:cidade', async (req, res) => {
  try {
    const cidade = req.params.cidade;

    // Consulte o MongoDB para obter os registros da cidade
    const placas = await Placa.find({ cidade });

    if (placas.length === 0) {
      return res.status(404).json({ mensagem: 'Nenhum registro encontrado para esta cidade' });
    }

    // Crie um PDF com as informações
    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(16).text(`Relatório para a cidade de ${cidade}\n\n`);
    placas.forEach(placa => {
      doc.text(`Número da Placa: ${placa.numeroPlaca}`);
      doc.text(`Data e Hora: ${placa.dataHora}\n\n`);
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

 
 // Rota para consultar se uma placa está no banco de dadosConexão MongoDB Atlas VS Code

 app.get('/consulta/:placa'), async (req, res) => {
   try {
     const numeroPlaca = req.params.placa;
 
     // Consulte o MongoDB para verificar se a placa existe
     const placa = await Placa.findOne({ numeroPlaca });
 
     if (placa) {
       res.json({ mensagem: 'Placa encontrada no banco de dados' });
     } else {
       res.json({ mensagem: 'Placa não encontrada no banco de dados' });
     }
   } catch (error) {
     console.error(error);
     res.status(500).json({ erro: 'Erro no servidor' });
   }
}

    app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
