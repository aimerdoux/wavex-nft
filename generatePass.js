const { PKPass } = require('passkit-generator');
const fs = require('fs');

(async () => {
  try {
    const pass = await PKPass.from({
      model: './glowTime.pass',
      certificates: {
        wwdr: fs.readFileSync('./certs/wwdr.pem'),
        signerCert: fs.readFileSync('./certs/signerCert.pem'),
        signerKey: fs.readFileSync('./certs/signerKey.pem')
      },
    }, {
      serialNumber: "WAVEX-001"
    });

    const buffer = pass.getAsBuffer();
    fs.writeFileSync('WaveXCard.pkpass', buffer);

    console.log('🎉 WaveX Pass generated successfully: WaveXCard.pkpass');
  } catch (err) {
    console.error('❌ Error generating pass:', err);
  }
})();
