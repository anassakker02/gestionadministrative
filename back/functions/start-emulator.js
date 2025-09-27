const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de l\'émulateur Firebase...\n');

// Fonction pour vérifier si un port est utilisé
const checkPort = (port) => {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Port libre
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Port utilisé
    });
  });
};

// Fonction pour attendre qu'un service soit prêt
const waitForService = (url, maxAttempts = 30) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkService = async () => {
      try {
        const axios = require('axios');
        const response = await axios.get(url, { timeout: 2000 });
        console.log('✅ Service prêt:', response.status);
        resolve(true);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`Service non accessible après ${maxAttempts} tentatives`));
          return;
        }
        console.log(`⏳ Tentative ${attempts}/${maxAttempts}...`);
        setTimeout(checkService, 2000);
      }
    };
    
    checkService();
  });
};

const startEmulator = async () => {
  try {
    // Vérifier si le port 5001 est déjà utilisé
    const portInUse = await checkPort(5001);
    if (portInUse) {
      console.log('⚠️  Le port 5001 est déjà utilisé');
      console.log('💡 Arrêtez l\'émulateur existant ou changez le port');
      return;
    }

    console.log('📡 Démarrage de l\'émulateur Firebase Functions...');
    
    // Démarrer l'émulateur
    const emulator = spawn('firebase', ['emulators:start', '--only', 'functions'], {
      cwd: __dirname,
      stdio: 'pipe',
      shell: true
    });

    emulator.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      // Détecter quand l'émulateur est prêt
      if (output.includes('All emulators ready') || output.includes('Emulator UI ready')) {
        console.log('\n🎉 Émulateur prêt!');
        console.log('🌐 Interface: http://localhost:4000');
        console.log('🔧 API: http://localhost:5001');
      }
    });

    emulator.stderr.on('data', (data) => {
      console.error('❌ Erreur émulateur:', data.toString());
    });

    emulator.on('close', (code) => {
      console.log(`\n📴 Émulateur arrêté avec le code: ${code}`);
    });

    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt de l\'émulateur...');
      emulator.kill('SIGINT');
      process.exit(0);
    });

    // Attendre que l'émulateur soit prêt
    try {
      await waitForService('http://localhost:5001/gestionadminastration/us-central1/api/v1/health');
      console.log('✅ Émulateur complètement opérationnel!');
    } catch (error) {
      console.log('⚠️  Émulateur démarré mais service non accessible:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error.message);
    process.exit(1);
  }
};

// Vérifier les prérequis
const checkPrerequisites = () => {
  try {
    require('firebase-tools');
    console.log('✅ Firebase CLI installé');
  } catch (error) {
    console.error('❌ Firebase CLI non installé');
    console.log('💡 Installez avec: npm install -g firebase-tools');
    process.exit(1);
  }
};

// Script principal
const main = async () => {
  console.log('🔍 Vérification des prérequis...');
  checkPrerequisites();
  
  console.log('🚀 Démarrage de l\'émulateur...');
  await startEmulator();
};

main().catch(console.error);
