/** Usage: npm run hash -- "MyPassword1"  -> prints a bcrypt (cost 12) hash for seed.sql */
import bcrypt from 'bcryptjs';
console.log(bcrypt.hashSync(process.argv[2] || '', 12));
