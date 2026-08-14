import dns from 'dns';
dns.setServers(['8.8.8.8']);
import mongoose from 'mongoose';
// redeploy: 2026-08-14

// ─── Pre-register all models to resolve Mongoose lazy-loading race conditions ───
import '../models/Farm';
import '../models/Land';
import '../models/BMC';

import '../models/Shed';
import '../models/Cattle';
import '../models/LiveStock';
import '../models/Animal';
import '../models/Tag';
import '../models/User';
import '../models/Role';
import '../models/Logs'; // registers CrossingLog, SaleLog, and TreatmentLog
import '../models/VaccinationLog';
import '../models/Vaccine';
import '../models/FeedInventory';
import '../models/MedicineInventory';
import '../models/Medicine';
import '../models/GrassCollection';
import '../models/DailyFeeding';
import '../models/MilkCollection';
import '../models/MilkQuality';
import '../models/Department';
import '../models/TagSuffix';
import '../models/Designation';
import '../models/Labor';
import '../models/ProcurementSource';
import '../../app/api/customer-app/models/Customer';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    try {
      dns.setServers(['8.8.8.8']);
      console.log('Dynamically set DNS servers to [8.8.8.8] in dbConnect worker thread.');
    } catch (err) {
      console.error('Non-blocking error setting DNS servers:', err);
    }

    cached.promise = mongoose.connect(mongodbUri, opts).then((mongoose) => {
      return mongoose;
    });
  }


  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
