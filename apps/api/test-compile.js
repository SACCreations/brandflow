const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("Success");
} catch (e) {
  console.log("Failed");
}
