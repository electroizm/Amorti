import {
  createIcons,
  Home,
  ClipboardList,
  Users,
  Settings,
  Plus,
  X,
  ArrowRight,
  Trash2,
  Pencil,
  Check,
  Eye,
  EyeOff,
  User,
  Send,
  LogOut,
  Moon,
  Sun,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Building2,
  TrendingUp
} from 'lucide';

const ikonlar = {
  Home, ClipboardList, Users, Settings, Plus, X,
  ArrowRight, Trash2, Pencil, Check, Eye, EyeOff, User,
  Send, LogOut, Moon, Sun, RotateCcw, ChevronDown, ChevronUp,
  Building2, TrendingUp
};

export function ikonlariGuncelle() {
  createIcons({ icons: ikonlar });
}
