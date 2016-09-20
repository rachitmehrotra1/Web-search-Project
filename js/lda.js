/*
 * Based on LDA Gibbs Sampler by  Blei et al. 2003
 */


 //Rachit Mehrotra
//rm4149@nyu.edu

 
function makeArray(x) {
	var a = new Array();	
	for (var i=0;i<x;i++)  {
		a[i]=0;
	}
	return a;
}

function make2DArray(x,y) {
	var a = new Array();	
	for (var i=0;i<x;i++)  {
		a[i]=new Array();
		for (var j=0;j<y;j++)
			a[i][j]=0;
	}
	return a;
}

var lda = new function() {
    //----------------------------------------------------------------------------------------
    //int[][] documents-document data (term lists)
    //V- vocabulary size
    //K-number of topics
    //alpha- lda parametere;document-topic association
    //beta- lda parameter; topic-term association
    //z[][]-topic assignments for each word
    //int[][] nw-cwt[i][j] number of instances of word i (term?) assigned to topic j.
    //int[][] nd-na[i][j] number of words in document i assigned to topic j
    //int[] nwsum-nwsum[j] total number of words assigned to topic j.
    //int[] ndsum-nasum[i] total number of words in document i
    //double[][] thetasum-cumulative statistics of theta
    //double[][] phisum-cumulative statistics of phi
    //int numstats-size of statistics
    //----------------------------------------------------------------------------------------

	var documents,z,nw,nd,nwsum,ndsum,thetasum,phisum,V,K,alpha,beta; 
    var THIN_INTERVAL = 20;//sampling lag
    var BURN_IN = 100;//burn-in period
    var ITERATIONS = 1000;//max iterations
    var SAMPLE_LAG;//sample lag (if -1 only one sample taken)
    var dispcol = 0;
	var numstats=0;
	this.configure = function (docs,v,iterations,burnIn,thinInterval,sampleLag) {
        this.ITERATIONS = iterations;
        this.BURN_IN = burnIn;
        this.THIN_INTERVAL = thinInterval;
        this.SAMPLE_LAG = sampleLag;
		this.documents = docs;//initializing with data
		this.V = v;
		this.dispcol=0;
		this.numstats=0; 
    }

    //Initialisation: Must start with an assignment of observations to topics
    //Many alternatives are possible, the one chosen is to perform random assignments with equal probabilities
	this.initialState = function (K) {
        var i;
        var M = this.documents.length;

        // initialise count variables
        this.nw = make2DArray(this.V,K); 
        this.nd = make2DArray(M,K); 
        this.nwsum = makeArray(K); 
        this.ndsum = makeArray(M);

        // The z_i are initialised to values in [1,K] to determine the initial state of the Markov chain.
        this.z = new Array();	for (i=0;i<M;i++) this.z[i]=new Array();
        for (var m = 0; m < M; m++) {
            var N = this.documents[m].length;
            this.z[m] = new Array();
            for (var n = 0; n < N; n++) {
                var topic = parseInt(""+(Math.random() * K));                 
                this.z[m][n] = topic;
                // number of instances of word i assigned to topic j.
                this.nw[this.documents[m][n]][topic]++;
                // number of words in document i assigned to topic j.
                this.nd[m][topic]++;
                // total number of words assigned to topic j.
                this.nwsum[topic]++;
            }
            // total number of words in document i.
            this.ndsum[m] = N;
        }
    }
	
    //Main method: Select initial state ? Repeat a large number of times:
    //1.Select an element 
    //2. Update conditional on other elements. If appropriate, output summary for each run.
	this.gibbs = function (K,alpha,beta) {
		var i;
        this.K = K;
        this.alpha = alpha;
        this.beta = beta;
        // init sampler statistics
        if (this.SAMPLE_LAG > 0) {
            this.thetasum = make2DArray(this.documents.length,this.K);
            this.phisum = make2DArray(this.K,this.V);
            this.numstats = 0;
        }

        // initial state of the Markov chain:
        this.initialState(K);


        for (i = 0; i < this.ITERATIONS; i++) {
            // for all z_i
			for (var m = 0; m < this.z.length; m++) {
                for (var n = 0; n < this.z[m].length; n++) {
			        var topic = this.sampleFullConditional(m, n);
					this.z[m][n] = topic;
                }
            }

            // display progress
            if ((i < this.BURN_IN) && (i % this.THIN_INTERVAL == 0)) {
				//document.write("B");
                this.dispcol++;
            }
            if ((i > this.BURN_IN) && (i % this.THIN_INTERVAL == 0)) {
                //document.write("S");
                this.dispcol++;
            }

            // get statistics after burn-in
            if ((i > this.BURN_IN) && (this.SAMPLE_LAG > 0) && (i % this.SAMPLE_LAG == 0)) {
                this.updateParams();
				//document.write("|");                
                if (i % this.THIN_INTERVAL != 0)
                    this.dispcol++;
            }
            if (this.dispcol >= 100) {
				//document.write("*<br/>");                
                this.dispcol = 0;
            }
        }
    }
	
	

    // Sample a topic z_i from the full conditional distribution: p(z_i = j | z_-i, w) = (n_-i,j(w_i) + beta)/(n_-i,j(.) + W * beta) * (n_-i,j(d_i) + alpha)/(n_-i,.(d_i) + K * alpha)
	this.sampleFullConditional = function(m,n) {
        // remove z_i from the count variables
        var topic = this.z[m][n];
        this.nw[this.documents[m][n]][topic]--;
        this.nd[m][topic]--;
        this.nwsum[topic]--;
        this.ndsum[m]--;

        // do multinomial sampling via cumulative method:
        var p = makeArray(this.K);
        for (var k = 0; k < this.K; k++) {
            p[k] = (this.nw[this.documents[m][n]][k] + this.beta) / (this.nwsum[k] + this.V * this.beta)
                * (this.nd[m][k] + this.alpha) / (this.ndsum[m] + this.K * this.alpha);
        }

        // cumulate multinomial parameters
        for (var k = 1; k < p.length; k++) {
            p[k] += p[k - 1];
        }

        // scaled sample because of unnormalised p[]
        var u = Math.random() * p[this.K - 1];
        for (topic = 0; topic < p.length; topic++) {
            if (u < p[topic])
                break;
        }

        // add newly estimated z_i to count variables
        this.nw[this.documents[m][n]][topic]++;
        this.nd[m][topic]++;
        this.nwsum[topic]++;
        this.ndsum[m]++;
        return topic;
    }
	

    //Add to the statistics the values of theta and phi for the current state.
	this.updateParams =function () {
        for (var m = 0; m < this.documents.length; m++) {
            for (var k = 0; k < this.K; k++) {
                this.thetasum[m][k] += (this.nd[m][k] + this.alpha) / (this.ndsum[m] + this.K * this.alpha);
            }
        }
        for (var k = 0; k < this.K; k++) {
            for (var w = 0; w < this.V; w++) {
                this.phisum[k][w] += (this.nw[w][k] + this.beta) / (this.nwsum[k] + this.V * this.beta);
            }
        }
        this.numstats++;
    }
	

    // Retrieve estimated document--topic associations. If sample lag > 0 then
    //  the mean value of all sampled statistics for theta[][] is taken.
    //  @return theta multinomial mixture of document topics (M x K)
	this.getTheta = function() {
        var theta = new Array(); for(var i=0;i<this.documents.length;i++) theta[i] = new Array();
        if (this.SAMPLE_LAG > 0) {
            for (var m = 0; m < this.documents.length; m++) {
                for (var k = 0; k < this.K; k++) {
                    theta[m][k] = this.thetasum[m][k] / this.numstats;
                }
            }
        } else {
            for (var m = 0; m < this.documents.length; m++) {
                for (var k = 0; k < this.K; k++) {
                    theta[m][k] = (this.nd[m][k] + this.alpha) / (this.ndsum[m] + this.K * this.alpha);
                }
            }
        }
        return theta;
    }
	

    // Retrieve estimated topic--word associations. If sample lag > 0 then the
    //  mean value of all sampled statistics for phi[][] is taken.
    //  @return phi multinomial mixture of topic words (K x V)
	this.getPhi = function () {
        var phi = new Array(); for(var i=0;i<this.K;i++) phi[i] = new Array();
        if (this.SAMPLE_LAG > 0) {
            for (var k = 0; k < this.K; k++) {
                for (var w = 0; w < this.V; w++) {
                    phi[k][w] = this.phisum[k][w] / this.numstats;
                }
            }
        } else {
            for (var k = 0; k < this.K; k++) {
                for (var w = 0; w < this.V; w++) {
                    phi[k][w] = (this.nw[w][k] + this.beta) / (this.nwsum[k] + this.V * this.beta);
                }
            }
        }
        return phi;
    }

}