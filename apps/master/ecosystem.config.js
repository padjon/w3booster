module.exports = {
    apps : [{
      name: 'w3booster-master',
      script: 'npm',
      args: "run prod-serve",

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'MM-DD HH:mm:ss',
    }],
  };
