import hashlib

def mask_ip(ip_address):
    return hashlib.sha256(ip_address.encode('utf-8')).hexdigest()[:8] + '***'

def mask_pii(record):
    record['email'] = record['email'][0] + '***@' + record['email'].split('@')[1]
    return record