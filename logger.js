const winston = require('winston');
const path = require('path');

const nivel = process.env.LOG_LEVEL || 'info';
const ehProducao = process.env.NODE_ENV === 'production';

const formatoConsole = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${extra}`;
  })
);

const formatoArquivo = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: nivel,
  format: formatoArquivo,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'erros.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'combinado.log')
    })
  ]
});

// Em desenvolvimento, também mostra tudo no console de forma legível.
// Em produção, muitos serviços de hospedagem já capturam a saída padrão (stdout) automaticamente,
// então também deixamos o console ativo, mas em formato JSON (mais fácil de consultar depois).
logger.add(new winston.transports.Console({
  format: ehProducao ? formatoArquivo : formatoConsole
}));

module.exports = logger;