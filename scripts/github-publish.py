"""Publish the authorized site using an existing Git credential; never print credentials."""
import json, os, subprocess, urllib.request, urllib.error
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
os.chdir(ROOT)
result=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,env={**os.environ,'GCM_INTERACTIVE':'never'},check=True)
credential=dict(line.split('=',1) for line in result.stdout.splitlines() if '=' in line)
token=credential.get('password')
if not token: raise SystemExit('Existing GitHub credential unavailable')

def api(method,path,data=None):
    req=urllib.request.Request('https://api.github.com'+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Galia-site-publisher','Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=35) as response:
            body=response.read(); return json.loads(body) if body else {}
    except urllib.error.HTTPError as error:
        if error.code==404:return None
        raise RuntimeError('GitHub API '+str(error.code)+': '+error.read().decode()[:600]) from None

owner=api('GET','/user')['login']; name='galia-espanol'; repo_path='/repos/'+owner+'/'+name
existing=api('GET',repo_path)
if existing is None:
    repo=api('POST','/user/repos',{'name':name,'description':'Галя Романова · Español vivo — испанский онлайн, запись и закрытый кабинет заявок','private':False,'auto_init':False})
elif existing.get('description')=='Галя Романова · Español vivo — испанский онлайн, запись и закрытый кабинет заявок':
    repo=existing
else: raise SystemExit('Repository name is already used by another project; nothing overwritten')
def git(*args):return subprocess.run(['git',*args],check=True,text=True,encoding='utf-8',errors='replace',capture_output=True).stdout.strip()
if not (ROOT/'.git').exists():
    git('init','-b','main')
if 'origin' not in git('remote').splitlines():
    git('remote','add','origin',repo['clone_url'])
git('add','.gitignore','package.json','public','scripts','tests','docs','README.md')
service_files=[Path('service/build.mjs'),Path('service/package.json'),Path('service/.gitignore'),Path('service/.openai/hosting.json'),*Path('service/worker').glob('*'),*Path('service/drizzle').rglob('*')]
for p in service_files:
    if p.is_file():
        sha=git('hash-object','-w',str(p));git('update-index','--add','--cacheinfo','100644,'+sha+','+p.as_posix())
if git('diff','--cached','--name-only'):git('commit','-m','feat: launch Galia Spanish teaching site and protected leads admin')
git('push','-u','origin','main')
pages=api('GET',repo_path+'/pages')
if pages is None:pages=api('POST',repo_path+'/pages',{'source':{'branch':'main','path':'/docs'},'build_type':'legacy'})
elif pages.get('source')!={'branch':'main','path':'/docs'}:pages=api('PUT',repo_path+'/pages',{'source':{'branch':'main','path':'/docs'},'build_type':'legacy'})
print(json.dumps({'repository':repo['html_url'],'site':pages.get('html_url','https://'+owner.lower()+'.github.io/'+name+'/'),'commit':git('rev-parse','HEAD')},ensure_ascii=True))
