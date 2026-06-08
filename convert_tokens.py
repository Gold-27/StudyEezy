import json
import re
import os

def slugify(name):
    # Split camelCase names by inserting a hyphen before capital letters
    name = re.sub(r'(?<!^)(?=[A-Z])', '-', str(name))
    name = name.lower()
    # Replace spaces and underscores with hyphens
    name = re.sub(r'[\s_]+', '-', name)
    # Remove any other non-alphanumeric characters except hyphen
    name = re.sub(r'[^\w\-]', '', name)
    # Remove any duplicate hyphens
    name = re.sub(r'-+', '-', name)
    return name.strip('-')

def map_path_to_css_var(path):
    root = path[0]
    rest = path[1:]
    
    slugified_root = slugify(root)
    slugified_rest = [slugify(p) for p in rest]
    
    if slugified_root == "primitive-color-collections":
        prefix = "primitive"
    elif slugified_root == "color-roles":
        prefix = "sys-color"
    elif slugified_root == "spacing":
        prefix = "sys-spacing"
    elif slugified_root == "radius":
        prefix = "sys-radius"
    elif slugified_root == "typography":
        prefix = "sys-typography"
    elif slugified_root == "font":
        prefix = "sys-font"
    elif slugified_root == "effect":
        prefix = "sys-effect"
    else:
        prefix = slugified_root
        
    parts = [prefix] + slugified_rest
    return "--" + "-".join(parts)

def collect_tokens(obj, path=[]):
    tokens = {}
    if isinstance(obj, dict):
        if "type" in obj and "value" in obj:
            tokens[tuple(path)] = obj
            return tokens
        for k, v in obj.items():
            if k in ("extensions", "description"):
                continue
            tokens.update(collect_tokens(v, path + [k]))
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            tokens.update(collect_tokens(item, path + [str(idx)]))
    return tokens

def resolve_value(val, tokens_dict):
    if isinstance(val, str) and val.startswith("{") and val.endswith("}"):
        ref_path_str = val[1:-1]
        ref_path = tuple(ref_path_str.split("."))
        if ref_path in tokens_dict:
            return f"var({map_path_to_css_var(ref_path)})"
        else:
            # Fallback check for case/space mismatch
            # Try to match by slugified keys
            slugified_ref = tuple(slugify(p) for p in ref_path)
            for k in tokens_dict:
                if tuple(slugify(p) for p in k) == slugified_ref:
                    return f"var({map_path_to_css_var(k)})"
            print(f"Warning: could not resolve reference {val}")
            return val
    return val

def format_token_value(token, tokens_dict):
    t_type = token.get("type")
    t_val = token.get("value")
    
    if isinstance(t_val, str) and t_val.startswith("{") and t_val.endswith("}"):
        return resolve_value(t_val, tokens_dict)
    
    if t_type == "color":
        return str(t_val)
        
    elif t_type == "dimension":
        try:
            num = float(t_val)
            if num == 0:
                return "0"
            if num.is_integer():
                return f"{int(num)}px"
            return f"{num}px"
        except (ValueError, TypeError):
            return str(t_val)
            
    elif t_type == "custom-shadow":
        offset_x = t_val.get("offsetX", 0)
        offset_y = t_val.get("offsetY", 0)
        radius = t_val.get("radius", 0)
        spread = t_val.get("spread", 0)
        color = t_val.get("color", "")
        
        if isinstance(color, str) and color.startswith("{") and color.endswith("}"):
            color = resolve_value(color, tokens_dict)
            
        def fmt_px(val):
            try:
                num = float(val)
                if num == 0:
                    return "0"
                if num.is_integer():
                    return f"{int(num)}px"
                return f"{num}px"
            except (ValueError, TypeError):
                return str(val)
                
        return f"{fmt_px(offset_x)} {fmt_px(offset_y)} {fmt_px(radius)} {fmt_px(spread)} {color}"
        
    elif t_type == "custom-fontStyle":
        font_style = t_val.get("fontStyle", "normal")
        font_weight = t_val.get("fontWeight", "400")
        font_size = t_val.get("fontSize", "16")
        line_height = t_val.get("lineHeight", "normal")
        font_family = t_val.get("fontFamily", "sans-serif")
        
        def fmt_px(val):
            try:
                num = float(val)
                if num == 0:
                    return "0"
                if num.is_integer():
                    return f"{int(num)}px"
                return f"{num}px"
            except (ValueError, TypeError):
                return str(val)
                
        fs = fmt_px(font_size)
        lh = fmt_px(line_height)
        
        family_str = str(font_family)
        if " " in family_str and not (family_str.startswith('"') or family_str.startswith("'")):
            family_str = f'"{family_str}"'
            
        return f"{font_style} {font_weight} {fs}/{lh} {family_str}"
        
    elif t_type == "number":
        return str(t_val)
        
    elif t_type == "string":
        return str(t_val)
        
    return str(t_val)

def main():
    json_path = "designs-tokens.tokens.json"
    css_path = "design-tokens.css"
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    tokens_dict = collect_tokens(data)
    
    # Separate primitive from system tokens for clean organization
    primitive_lines = []
    system_lines = []
    
    for path, token in tokens_dict.items():
        var_name = map_path_to_css_var(path)
        formatted_val = format_token_value(token, tokens_dict)
        comment = token.get("description", "").replace("\n", " ")
        comment_str = f" /* {comment} */" if comment else ""
        
        line = f"  {var_name}: {formatted_val};{comment_str}"
        
        if path[0].lower().startswith("primitive"):
            primitive_lines.append(line)
        else:
            system_lines.append(line)
            
    # Sort for predictability and readability
    primitive_lines.sort()
    system_lines.sort()
    
    css_content = [
        "/* Generated Design Tokens CSS Variables */",
        ":root {",
        "  /* Primitive/Reference Color Tokens */"
    ]
    css_content.extend(primitive_lines)
    css_content.append("")
    css_content.append("  /* System/Semantic Tokens */")
    css_content.extend(system_lines)
    css_content.append("}")
    css_content.append("")
    
    with open(css_path, "w", encoding="utf-8") as out:
        out.write("\n".join(css_content))
        
    print(f"Successfully converted design tokens and wrote to {css_path}")

if __name__ == "__main__":
    main()
