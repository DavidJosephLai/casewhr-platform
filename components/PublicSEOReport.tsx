import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  FileText, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  Search,
  Award,
  AlertCircle,
  ExternalLink 
} from 'lucide-react';