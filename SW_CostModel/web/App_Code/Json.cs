using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Web.Script.Serialization;

/// <summary>JSON reading and writing with the serializer built into .NET Framework (no NuGet packages).</summary>
public static class Json
{
    public static JavaScriptSerializer Serializer()
    {
        var s = new JavaScriptSerializer();
        s.MaxJsonLength = Int32.MaxValue;
        s.RecursionLimit = 64;
        return s;
    }

    public static IDictionary<string, object> Obj(IDictionary<string, object> d, string key)
    {
        object v;
        if (d != null && d.TryGetValue(key, out v))
            return v as IDictionary<string, object>;
        return null;
    }

    public static IList List(IDictionary<string, object> d, string key)
    {
        object v;
        if (d != null && d.TryGetValue(key, out v))
            return v as IList;
        return null;
    }

    public static bool Has(IDictionary<string, object> d, string key)
    {
        object v;
        return d != null && d.TryGetValue(key, out v) && v != null;
    }

    /// <summary>A number from 0 to max. Missing, negative or unreadable values give def or 0.</summary>
    public static decimal Num(IDictionary<string, object> d, string key, decimal def, decimal max)
    {
        object v;
        if (d == null || !d.TryGetValue(key, out v) || v == null) return def;
        decimal r;
        if (v is bool) r = (bool)v ? 1 : 0;
        else if (v is string)
        {
            if (!Decimal.TryParse((string)v, NumberStyles.Float, CultureInfo.InvariantCulture, out r)) return def;
        }
        else
        {
            try { r = Convert.ToDecimal(v, CultureInfo.InvariantCulture); }
            catch (Exception) { return def; }
        }
        if (r < 0) return 0;
        return r > max ? max : r;
    }

    /// <summary>Trimmed text cut to maxLength; null when missing.</summary>
    public static string Text(IDictionary<string, object> d, string key, int maxLength)
    {
        object v;
        if (d == null || !d.TryGetValue(key, out v) || v == null) return null;
        string s = (v is string) ? (string)v : Convert.ToString(v, CultureInfo.InvariantCulture);
        s = s.Trim();
        return s.Length > maxLength ? s.Substring(0, maxLength) : s;
    }

    public static bool Bool(IDictionary<string, object> d, string key)
    {
        object v;
        if (d == null || !d.TryGetValue(key, out v) || v == null) return false;
        if (v is bool) return (bool)v;
        return Num(d, key, 0, 1) != 0;
    }

    /// <summary>Reads a value at a dotted path such as "load.cont".</summary>
    public static object Get(IDictionary<string, object> d, string path)
    {
        string[] parts = path.Split('.');
        for (int i = 0; i < parts.Length - 1 && d != null; i++)
            d = Obj(d, parts[i]);
        object v;
        return (d != null && d.TryGetValue(parts[parts.Length - 1], out v)) ? v : null;
    }

    /// <summary>Writes a value at a dotted path, creating the objects on the way.</summary>
    public static void Set(IDictionary<string, object> d, string path, object value)
    {
        string[] parts = path.Split('.');
        for (int i = 0; i < parts.Length - 1; i++)
        {
            IDictionary<string, object> next = Obj(d, parts[i]);
            if (next == null)
            {
                next = new Dictionary<string, object>();
                d[parts[i]] = next;
            }
            d = next;
        }
        d[parts[parts.Length - 1]] = value;
    }
}
