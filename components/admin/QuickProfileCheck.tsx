import { useAuth } from '../../contexts/AuthContext';
import { isAnyAdmin, getAdminLevel, isSuperAdmin } from '../../config/admin';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function QuickProfileCheck() {
  const { user, profile } = useAuth();

  if (!user) return null;

  const isAdmin = isAnyAdmin(user.email, profile);
  const adminLevel = getAdminLevel(user.email, profile);
  const isSuperAdminUser = isSuperAdmin(user.email);

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Quick Profile Check (Current User)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium text-gray-600">Email:</div>
          <div className="font-mono">{user.email}</div>

          <div className="font-medium text-gray-600">User ID:</div>
          <div className="font-mono text-[10px]">{user.id}</div>

          <div className="font-medium text-gray-600">isAnyAdmin():</div>
          <div>
            {isAdmin ? (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                TRUE
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                FALSE
              </Badge>
            )}
          </div>

          <div className="font-medium text-gray-600">isSuperAdmin():</div>
          <div>
            {isSuperAdminUser ? (
              <Badge variant="default" className="text-xs bg-yellow-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                TRUE
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                FALSE
              </Badge>
            )}
          </div>

          <div className="font-medium text-gray-600">getAdminLevel():</div>
          <div className="font-mono">{adminLevel || 'null'}</div>

          <div className="font-medium text-gray-600">profile?.isAdmin:</div>
          <div>
            {profile?.isAdmin === true ? (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                TRUE
              </Badge>
            ) : profile?.isAdmin === false ? (
              <Badge variant="secondary" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                FALSE
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                undefined
              </Badge>
            )}
          </div>

          <div className="font-medium text-gray-600">profile?.adminLevel:</div>
          <div className="font-mono">{profile?.adminLevel || 'undefined'}</div>
        </div>

        <div className="pt-2 border-t">
          <details className="text-[10px]">
            <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-900">
              Full Profile Object (click to expand)
            </summary>
            <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
