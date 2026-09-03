#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
from html import escape
import re

ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'content'/'blog'

def parse_frontmatter(text):
    if not text.startswith('---\n'): return {},text
    _,fm,body=text.split('---',2)
    data={}
    for raw in fm.strip().splitlines():
        if ':' not in raw: continue
        k,v=raw.split(':',1); v=v.strip()
        if v.lower() in ('true','false'): value=v.lower()=='true'
        else: value=v.strip('"\'')
        data[k.strip()]=value
    return data,body.strip()

def inline(s):
    s=escape(s,quote=False)
    s=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',s)
    s=re.sub(r'\[(.+?)\]\((https?://[^)]+)\)',r'<a href="\2" target="_blank" rel="noopener">\1</a>',s)
    return s

def markdown(body):
    out=[]; para=[]; in_ul=False
    def flush():
        nonlocal para
        if para:
            out.append('<p>'+inline(' '.join(x.strip() for x in para))+'</p>'); para=[]
    for line in body.splitlines():
        st=line.strip()
        if not st:
            flush()
            if in_ul: out.append('</ul>'); in_ul=False
            continue
        if st.startswith('## '):
            flush()
            if in_ul: out.append('</ul>'); in_ul=False
            out.append('<h2>'+inline(st[3:])+'</h2>')
        elif st.startswith('### '):
            flush()
            if in_ul: out.append('</ul>'); in_ul=False
            out.append('<h3>'+inline(st[4:])+'</h3>')
        elif st.startswith('- '):
            flush()
            if not in_ul: out.append('<ul>'); in_ul=True
            out.append('<li>'+inline(st[2:])+'</li>')
        else: para.append(st)
    flush()
    if in_ul: out.append('</ul>')
    return '\n'.join(out)

def slug_from_file(path):
    name=path.stem
    name=re.sub(r'^\d{4}-\d{2}-\d{2}-','',name)
    return name

def fmt_date(s):
    try:return datetime.strptime(str(s),'%Y-%m-%d').strftime('%d %b %Y').upper()
    except:return str(s).upper()

def page_shell(title,desc,body,cls=''):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08090B"><link rel="icon" href="logo/logo.png" type="image/png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="v10.css?v=20260903"><script defer src="v10.js?v=20260903"></script><title>{escape(title)}</title><meta name="description" content="{escape(desc,quote=True)}"></head><body class="{cls}"><a class="skip-link" href="#main-content">Skip to content</a><div data-v10-header></div><main id="main-content">{body}</main><div data-v10-footer></div></body></html>'''

posts=[]
for p in CONTENT.glob('*.md'):
    meta,body=parse_frontmatter(p.read_text(encoding='utf-8'))
    if meta.get('published',True) is False: continue
    meta['slug']=slug_from_file(p); meta['body']=body; meta['path']=p
    posts.append(meta)
posts.sort(key=lambda x:str(x.get('date','')),reverse=True)

for post in posts:
    htmlbody=markdown(post['body'])
    body=f'''<section class="article-hero"><div class="shell article-hero-grid"><div><a class="article-back" href="blog.html">← Blog</a><p class="eyebrow">{escape(str(post.get('category','Blog')))}</p><h1>{escape(str(post.get('title','Untitled')))}</h1><div class="article-meta">{fmt_date(post.get('date',''))} · PLUTUS HOTEL REVENUE</div></div><figure><img src="{escape(str(post.get('cover','index/tai.webp')),quote=True)}" alt=""></figure></div></section><article class="article-body"><div class="article-body-inner">{htmlbody}</div></article>'''
    (ROOT/f"blog-{post['slug']}.html").write_text(page_shell(post['title']+' | Plutus Hotel Revenue',post.get('excerpt',''),body,'page-article'),encoding='utf-8')

if posts:
    lead=posts[0]
    other=posts[1:]
    feature=f'''<section class="blog-feature"><a href="blog-{lead['slug']}.html"><figure><img src="{escape(str(lead.get('cover','index/tai.webp')),quote=True)}" alt=""></figure><div class="blog-feature-copy"><small>{escape(str(lead.get('category','Blog')).upper())} · {fmt_date(lead.get('date',''))}</small><h2>{escape(str(lead.get('title','')))}</h2><p>{escape(str(lead.get('excerpt','')))}</p><strong>Read article ↗</strong></div></a></section>'''
    rows=''.join(f'''<a class="blog-row" href="blog-{p['slug']}.html"><time>{fmt_date(p.get('date',''))}</time><h3>{escape(str(p.get('title','')))}</h3><span>{escape(str(p.get('category','Blog')))} · Read ↗</span></a>''' for p in other)
    body=f'''<section class="blog-hero"><div class="shell"><p class="eyebrow">Plutus / Blog</p><h1>Hotel thinking,<br>without the filler.</h1><p>Revenue, distribution, technology, direct booking and the travel changes that can alter how a hotel performs.</p></div></section>{feature}<section class="blog-list"><div class="shell"><div class="blog-list-head"><h2>All posts</h2><span>{len(posts)} articles</span></div>{rows}</div></section>'''
    (ROOT/'blog.html').write_text(page_shell('Hotel Revenue Blog | Plutus','Hotel revenue, distribution, technology and travel articles from Plutus.',body,'page-blog'),encoding='utf-8')

# update homepage featured strip
index=ROOT/'index.html'
if index.exists():
    s=index.read_text(encoding='utf-8')
    featured=[p for p in posts if p.get('featured',False)][:3]
    if len(featured)<3: featured=(featured+posts)[:3]
    cards=''.join(f'''<a class="featured-post" href="blog-{p['slug']}.html"><figure><img src="{escape(str(p.get('cover','index/tai.webp')),quote=True)}" alt=""></figure><div class="post-copy"><small>{escape(str(p.get('category','Blog')).upper())} · {fmt_date(p.get('date',''))}</small><h3>{escape(str(p.get('title','')))}</h3></div></a>''' for p in featured)
    replacement='<!-- BLOG_FEATURED_START --><div class="featured-posts" data-blog-featured>'+cards+'</div><!-- BLOG_FEATURED_END -->'
    s=re.sub(r'<!-- BLOG_FEATURED_START -->.*?<!-- BLOG_FEATURED_END -->',replacement,s,flags=re.S)
    index.write_text(s,encoding='utf-8')

# sitemap
static=['index.html','about.html','revenue_management.html','software.html','mews_pms.html','cloudbeds_pms.html','siteminder_chm.html','tips.html','hotel_photoshoot_tips.html','web_design_tips.html','digital_marketing_tips.html','hotel-break-even-calculator.html','blog.html','contact.html','privacy_policy.html','terms_and_conditions.html']
urls=static+[f"blog-{p['slug']}.html" for p in posts]
sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>https://plutushotelrevenue.com/{u}</loc></url>\n' for u in urls)+'</urlset>\n'
(ROOT/'sitemap.xml').write_text(sitemap,encoding='utf-8')
print(f'Built {len(posts)} blog posts')
